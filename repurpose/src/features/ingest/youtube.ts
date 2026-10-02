import "server-only";
import { z } from "zod";

import { REMOTE_FETCH_TIMEOUT_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { youtubeCanonicalUrl, youtubeThumbnail } from "./detect";
import { buildSource } from "./normalize";
import type { Source } from "./types";

const SUPADATA_ENDPOINT = "https://api.supadata.ai/v1/youtube/transcript";

const TranscriptOk = z.object({ content: z.string() });
const TranscriptErr = z.object({ error: z.string(), message: z.string().optional() });
const OEmbed = z.object({ title: z.string(), author_name: z.string().optional() });

/** Every provider outcome becomes one of five human messages. The UI never sees a raw code. */
function mapSupadataError(status: number, code: string | null): AppError {
  if (status === 206 || code === "transcript-unavailable") {
    return new AppError(
      "INVALID_INPUT",
      "This video has no captions, so there's no transcript to pull. Paste the script instead.",
    );
  }
  if (status === 404 || code === "video-not-found" || code === "video-unavailable") {
    return new AppError(
      "NOT_FOUND",
      "We couldn't open that video. It may be private, removed, or age-restricted.",
    );
  }
  if (status === 429 || code === "limit-exceeded") {
    return new AppError(
      "RATE_LIMITED",
      "We've hit our transcript limit for the moment. Try again in a minute, or paste the text.",
    );
  }
  return new AppError(
    "PROVIDER_ERROR",
    "YouTube import is temporarily unavailable. Paste the transcript instead.",
    { cause: { status, code } },
  );
}

async function fetchTranscript(videoId: string): Promise<string> {
  if (!env.SUPADATA_API_KEY) {
    throw new AppError(
      "PROVIDER_ERROR",
      "YouTube import isn't set up in this environment. Paste the transcript instead.",
    );
  }

  const params = new URLSearchParams({ url: youtubeCanonicalUrl(videoId), text: "true" });
  let res: Response;
  try {
    res = await fetch(`${SUPADATA_ENDPOINT}?${params}`, {
      headers: { "x-api-key": env.SUPADATA_API_KEY },
      signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    throw new AppError(
      "PROVIDER_ERROR",
      "Fetching the transcript took too long. Try again, or paste the text.",
      { cause: e },
    );
  }

  const body: unknown = await res.json().catch(() => null);
  const ok = TranscriptOk.safeParse(body);
  if (res.ok && ok.success && ok.data.content.trim()) return ok.data.content;

  const err = TranscriptErr.safeParse(body);
  throw mapSupadataError(res.status, err.success ? err.data.error : null);
}

/** Title + channel via oEmbed. Best-effort: a failure here never fails the import. */
async function fetchMeta(
  videoId: string,
): Promise<{ title: string | null; author: string | null }> {
  const none = { title: null, author: null };
  try {
    const params = new URLSearchParams({ url: youtubeCanonicalUrl(videoId), format: "json" });
    const res = await fetch(`https://www.youtube.com/oembed?${params}`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return none;
    const parsed = OEmbed.safeParse(await res.json());
    return parsed.success
      ? { title: parsed.data.title, author: parsed.data.author_name ?? null }
      : none;
  } catch {
    return none;
  }
}

export async function fetchYouTubeSource(videoId: string): Promise<Source> {
  const [text, meta] = await Promise.all([fetchTranscript(videoId), fetchMeta(videoId)]);

  const source = buildSource({
    type: "youtube",
    text,
    title: meta.title,
    url: youtubeCanonicalUrl(videoId),
    thumbnailUrl: youtubeThumbnail(videoId),
    author: meta.author,
  });

  logger.info("youtube source fetched", {
    videoId,
    wordCount: source.wordCount,
    truncated: source.truncated,
  });
  return source;
}
