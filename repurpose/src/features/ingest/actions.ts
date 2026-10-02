"use server";

import { MIN_SOURCE_WORDS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { authedAction } from "@/lib/safe-action";

import { detectInput } from "./detect";
import { FetchSourceSchema } from "./schema";
import { fetchArticleSource } from "./url";
import { fetchYouTubeSource } from "./youtube";

export const fetchSource = authedAction(FetchSourceSchema, async ({ url }) => {
  const detected = detectInput(url);

  const source =
    detected.kind === "youtube"
      ? await fetchYouTubeSource(detected.videoId)
      : detected.kind === "url"
        ? await fetchArticleSource(detected.url)
        : null;

  if (!source) throw new AppError("INVALID_INPUT", "That doesn't look like a link we can import.");
  if (source.wordCount < MIN_SOURCE_WORDS) {
    throw new AppError(
      "INVALID_INPUT",
      "There isn't enough text there to work with. Paste it directly instead.",
    );
  }
  return source;
});
