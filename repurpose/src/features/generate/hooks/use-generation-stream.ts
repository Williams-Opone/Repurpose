"use client";

import { useRef, useState } from "react";

import type { Source } from "@/features/ingest/types";
import type { Format } from "@/types";

import type { StreamEvent } from "../schema";
import { EMPTY_STATE, failStreaming, type GenerationState, type RequestError } from "../state";
import { readSseStream } from "../stream-protocol";

async function parseError(res: Response): Promise<RequestError> {
  const fallback: RequestError = { code: "NETWORK", message: `Request failed (${res.status}).` };
  try {
    const j = (await res.json()) as { error?: unknown; message?: unknown };
    return typeof j.error === "string"
      ? { code: j.error as RequestError["code"], message: String(j.message ?? fallback.message) }
      : fallback;
  } catch {
    return fallback;
  }
}

export function useGenerationStream(initial: GenerationState) {
  const [state, setState] = useState<GenerationState>(initial);
  const abortRef = useRef<AbortController | null>(null);
  const revisions = useRef<Partial<Record<Format, number>>>({});

  function applyEvent(e: StreamEvent) {
    setState((s) => {
      switch (e.type) {
        case "start":
          return { ...s, generationId: e.generationId };
        case "partial":
          return {
            ...s,
            formats: { ...s.formats, [e.format]: { status: "streaming", partial: e.payload } },
          };
        case "done": {
          const revision = (revisions.current[e.format] ?? 0) + 1;
          revisions.current[e.format] = revision;
          return {
            ...s,
            formats: {
              ...s.formats,
              [e.format]: {
                status: "done",
                outputId: e.outputId,
                content: e.content,
                tokensUsed: e.tokensUsed,
                revision,
              },
            },
          };
        }
        case "error":
          return {
            ...s,
            formats: { ...s.formats, [e.format]: { status: "error", message: e.message } },
          };
        case "complete":
          return { ...s, running: false };
      }
    });
  }

  /** Returns a RequestError if the request itself was rejected (quota, auth, network). */
  async function run(
    url: string,
    body: unknown,
    formats: Format[],
    replaceAll: boolean,
  ): Promise<RequestError | null> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const streaming = Object.fromEntries(
      formats.map((f) => [f, { status: "streaming", partial: undefined }]),
    );
    setState((s) => ({
      ...s,
      running: true,
      requestError: null,
      generationId: replaceAll ? null : s.generationId,
      formats: replaceAll ? streaming : { ...s.formats, ...streaming },
    }));

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("text/event-stream")) {
        const err = await parseError(res);
        const idle = Object.fromEntries(formats.map((f) => [f, { status: "idle" }]));
        setState((s) => ({
          ...s,
          running: false,
          requestError: err,
          formats: { ...s.formats, ...idle },
        }));
        return err;
      }
      await readSseStream(res, applyEvent);
      return null;
    } catch {
      const cancelled = controller.signal.aborted;
      const err: RequestError | null = cancelled
        ? null
        : { code: "NETWORK", message: "Lost the connection mid-generation. Try again." };
      setState((s) => ({
        ...s,
        running: false,
        requestError: err,
        formats: failStreaming(
          s.formats,
          cancelled ? "Cancelled." : "Interrupted. Regenerate to retry.",
        ),
      }));
      return err;
    } finally {
      setState((s) =>
        s.running ? { ...s, running: false, formats: failStreaming(s.formats, "Interrupted.") } : s,
      );
    }
  }

  return {
    state,
    generate: (args: { source: Source; formats: Format[]; voiceId: string | null }) =>
      run("/api/generate", args, args.formats, true),
    regenerate: (format: Format, instruction?: string) =>
      state.generationId
        ? run(
            `/api/generate/${state.generationId}/regenerate`,
            { format, instruction },
            [format],
            false,
          )
        : Promise.resolve<RequestError>({
            code: "INVALID_INPUT",
            message: "Generate something first.",
          }),
    cancel: () => abortRef.current?.abort(),
    reset: () => {
      abortRef.current?.abort();
      revisions.current = {};
      setState(EMPTY_STATE);
    },
  };
}
