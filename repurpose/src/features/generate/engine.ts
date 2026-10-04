import "server-only";
import { APICallError, NoObjectGeneratedError, RetryError, streamObject } from "ai";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

import { db } from "@/db";
import { generations, outputs } from "@/db/schema";
import { refundGeneration } from "@/features/billing";
import type { Source } from "@/features/ingest/types";
import { getModel, modelGate } from "@/lib/ai";
import { GENERATION_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { Format } from "@/types";

import { composePrompt } from "./prompts/compose";
import { FORMAT_REGISTRY, FormatValidationError } from "./prompts/formats";
import type { StreamEvent } from "./schema";
import { encodeEvent } from "./stream-protocol";

export type RunArgs = {
  generationId: string;
  userId: string;
  source: Source;
  formats: Format[];
  voiceBlock: string | null;
  instruction?: string | null;
  /** Aborts every in-flight model call (wired to the request signal). */
  signal: AbortSignal;
  /** Refund the user's quota if EVERY format fails. False for regenerations (they're free). */
  refundOnFailure: boolean;
};

type Emit = (event: StreamEvent) => void;

const isRetryable = (e: unknown) =>
  NoObjectGeneratedError.isInstance(e) || e instanceof FormatValidationError || e instanceof ZodError;

const describeFailure = (e: unknown) =>
  e instanceof Error ? e.message.slice(0, 300) : "output did not match the schema";

/** The SDK wraps the final provider error in RetryError after its own retries. Look inside. */
function rootCause(e: unknown): unknown {
  return RetryError.isInstance(e) ? (e.lastError ?? e) : e;
}

/** Structured error details for logs — status + response body are what diagnose provider failures. */
function errorDetails(e: unknown) {
  if (APICallError.isInstance(e)) {
    return {
      name: e.name,
      status: e.statusCode ?? null,
      retryable: e.isRetryable,
      body: e.responseBody?.slice(0, 600) ?? null,
    };
  }
  return { name: e instanceof Error ? e.name : "unknown", message: String(e).slice(0, 600) };
}

/** Seconds the provider asked us to wait, if it said. */
function retryAfterSeconds(e: APICallError): number | null {
  const m = /"retryDelay":\s*"(\d+)(?:\.\d+)?s"/.exec(e.responseBody ?? "");
  return m?.[1] ? Number(m[1]) : null;
}

function humanMessage(e: unknown): string {
  if (e instanceof Error && e.name === "TimeoutError") {
    return `Took longer than ${GENERATION_TIMEOUT_MS / 1000}s. Try again.`;
  }
  if (APICallError.isInstance(e)) {
    if (e.statusCode === 429) {
      const wait = retryAfterSeconds(e);
      if (wait && wait > 300) {
        return `We've hit today's AI provider limit. It resets in about ${Math.ceil(wait / 3600)}h.`;
      }
      return "The AI provider is rate-limiting us right now. Wait a minute and try again.";
    }
    if (e.statusCode === 503) return "The AI provider is overloaded. Try again in a moment.";
  }
  if (isRetryable(e)) return "Came back malformed twice. Try regenerating.";
  return "Our AI provider hiccuped on this one. Try regenerating.";
}

async function runFormat(format: Format, args: RunArgs, emit: Emit): Promise<boolean> {
  const formatModule = FORMAT_REGISTRY[format];
  let previousError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const signal = AbortSignal.any([args.signal, AbortSignal.timeout(GENERATION_TIMEOUT_MS)]);
    try {
      const { system, prompt } = composePrompt({
        module: formatModule,
        source: args.source,
        voiceBlock: args.voiceBlock,
        instruction: args.instruction,
        previousError,
      });

      // Gate the provider call so N formats don't hit the API in the same instant.
      const { raw, usage } = await modelGate.run(async () => {
        const result = streamObject({
          model: getModel(),
          schema: formatModule.schema,
          schemaName: formatModule.schemaName,
          system,
          prompt,
          temperature: 0.7,
          maxRetries: 1,
          abortSignal: signal,
          
        });

        for await (const partial of result.partialObjectStream) {
          emit({ type: "partial", format, payload: partial });
        }

        const [raw, usage] = await Promise.all([result.object, result.usage]);
        return { raw, usage };
      });

      const content = formatModule.finalize(raw);
      const tokensUsed = usage.totalTokens ?? null;

      // Upsert: a regeneration replaces the row and clears the user's edits.
      const [row] = await db
        .insert(outputs)
        .values({ generationId: args.generationId, format, content, tokensUsed })
        .onConflictDoUpdate({
          target: [outputs.generationId, outputs.format],
          set: { content, editedContent: null, tokensUsed, updatedAt: new Date() },
        })
        .returning({ id: outputs.id });
      if (!row) throw new Error("output insert returned no row");

      emit({ type: "done", format, outputId: row.id, content, tokensUsed });
      logger.info("format generated", {
        generationId: args.generationId,
        format,
        attempt,
        tokensUsed,
      });
      return true;
    } catch (e) {
      if (args.signal.aborted) {
        logger.warn("format aborted by request signal", {
          generationId: args.generationId,
          format,
          attempt,
          reason: String(args.signal.reason ?? "unknown"),
        });
        emit({ type: "error", format, message: "The request was cancelled. Try again." });
        return false;
      }

      if (isRetryable(e) && attempt === 0) {
        previousError = describeFailure(e);
        logger.warn("format failed validation, retrying", {
          generationId: args.generationId,
          format,
          previousError,
        });
        continue;
      }

      // ---- THIS is where the snippet lives: the final failure path ----
      const cause = rootCause(e);
      logger.error("format failed", {
        generationId: args.generationId,
        format,
        attempt,
        ...errorDetails(cause),
      });
      emit({ type: "error", format, message: humanMessage(cause) });
      return false;
    }
  }
  return false;
}

/** Runs every format in parallel and multiplexes them into one SSE byte stream. */
export function runGeneration(args: RunArgs): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit: Emit = (event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          closed = true;
        }
      };

      emit({ type: "start", generationId: args.generationId, formats: args.formats });

      const results = await Promise.all(args.formats.map((f) => runFormat(f, args, emit)));
      const failedFormats = args.formats.filter((_, i) => !results[i]);
      const status = failedFormats.length === args.formats.length ? "failed" : "complete";

      try {
        await db
          .update(generations)
          .set({
            status,
            completedAt: new Date(),
            errorMessage: failedFormats.length ? `Failed: ${failedFormats.join(", ")}` : null,
          })
          .where(eq(generations.id, args.generationId));
        if (status === "failed" && args.refundOnFailure) await refundGeneration(args.userId);
      } catch (e) {
        logger.error("could not finalize generation", {
          generationId: args.generationId,
          cause: String(e),
        });
      }

      emit({ type: "complete", status, failedFormats });
      closed = true;
      controller.close();
    },
  });
}