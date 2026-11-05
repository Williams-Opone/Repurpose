import { getEntitlements, refundGeneration, reserveGeneration } from "@/features/billing";
import { GenerateRequestSchema, runGeneration } from "@/features/generate";
import { buildSource } from "@/features/ingest";
import { getDefaultVoice, renderVoiceBlock, requireOwnedVoice } from "@/features/voice";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { GENERATE_MAX_DURATION_S } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { assertRateLimit, generateLimiter } from "@/lib/redis";

export const maxDuration = GENERATE_MAX_DURATION_S;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    await assertRateLimit(generateLimiter, userId);

    const body = await req.json().catch(() => null);
    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("generate: invalid request", { issues: parsed.error.issues.slice(0, 5) });
      throw new AppError("INVALID_INPUT");
    }
    const { formats, voiceId } = parsed.data;
    // Re-normalize server-side; never trust client-computed counts.
    const source = buildSource(parsed.data.source);

    const voice = voiceId
      ? await requireOwnedVoice(voiceId, userId)
      : await getDefaultVoice(userId);
    const voiceBlock = voice?.profile ? renderVoiceBlock(voice.profile, voice.samples) : null;

    const entitlements = await getEntitlements(userId);
    await reserveGeneration(userId, entitlements); // throws QUOTA_EXCEEDED (402)

    let generationId: string;
    try {
      const [row] = await db
        .insert(generations)
        .values({
          userId,
          voiceId: voice?.id ?? null,
          sourceType: source.type,
          sourceTitle: source.title,
          sourceUrl: source.url,
          sourceContent: source.text,
          formats,
          status: "streaming",
        })
        .returning({ id: generations.id });
      if (!row) throw new AppError("INTERNAL");
      generationId = row.id;
    } catch (e) {
      await refundGeneration(userId);
      throw e;
    }

    logger.info("generation started", {
      generationId,
      userId,
      formats,
      plan: entitlements.plan,
      hasVoice: Boolean(voiceBlock),
    });

    const stream = runGeneration({
      generationId,
      userId,
      source,
      formats,
      voiceBlock,
      signal: req.signal,
      refundOnFailure: true,
    });
    return new Response(stream, { headers: SSE_HEADERS });
  } catch (e) {
    return errorResponse(e);
  }
}
