import { z } from "zod";

import { db } from "@/db";
import { generations } from "@/db/schema";
import {
  RegenerateRequestSchema,
  requireOwnedGeneration,
  runGeneration,
} from "@/features/generate";
import { buildSource, parseYouTubeUrl, youtubeThumbnail } from "@/features/ingest";
import { getDefaultVoice, getVoice, renderVoiceBlock } from "@/features/voice";
import { requireUserId } from "@/lib/auth";
import { GENERATE_MAX_DURATION_S } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { assertRateLimit, generateLimiter } from "@/lib/redis";
import { eq } from "drizzle-orm";

export const maxDuration = GENERATE_MAX_DURATION_S;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    await assertRateLimit(generateLimiter, userId);

    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) throw new AppError("NOT_FOUND");

    const parsed = RegenerateRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new AppError("INVALID_INPUT");
    const { format, instruction } = parsed.data;

    const generation = await requireOwnedGeneration(id, userId);
    if (!generation.formats.includes(format)) {
      throw new AppError("INVALID_INPUT", "That format isn't part of this generation.");
    }

    const videoId = generation.sourceUrl ? parseYouTubeUrl(generation.sourceUrl) : null;
    const source = buildSource({
      type: generation.sourceType,
      text: generation.sourceContent,
      title: generation.sourceTitle,
      url: generation.sourceUrl,
      thumbnailUrl: videoId ? youtubeThumbnail(videoId) : null,
    });

    const voice =
      (generation.voiceId ? await getVoice(generation.voiceId, userId) : null) ??
      (await getDefaultVoice(userId));
    const voiceBlock = voice?.profile ? renderVoiceBlock(voice.profile, voice.samples) : null;

    await db.update(generations).set({ status: "streaming" }).where(eq(generations.id, id));
    logger.info("regeneration started", {
      generationId: id,
      format,
      hasInstruction: Boolean(instruction),
    });

    return new Response(
      runGeneration({
        generationId: id,
        userId,
        source,
        formats: [format],
        voiceBlock,
        instruction,
        signal: req.signal,
        refundOnFailure: false, // regenerations are free
      }),
      {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
