import { z } from "zod";

import { INSTAGRAM_MAX_CHARS, INSTAGRAM_MAX_HASHTAGS } from "@/lib/constants";

import { normalizeText, requireText, truncateAtBoundary } from "./shared";
import { defineFormat } from "./types";

export const CaptionRawSchema = z.object({
  body: z
    .string()
    .describe("Caption ≤ 1,500 characters. Hook under 125 chars on line one. No hashtags here."),
  hashtags: z.array(z.string()).describe("5–8 topic-specific hashtags WITHOUT the # symbol."),
});
export type CaptionRaw = z.infer<typeof CaptionRawSchema>;

const HASHTAG_OK = /^[\p{L}\p{N}_]+$/u;

export function cleanHashtags(tags: string[], max = INSTAGRAM_MAX_HASHTAGS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.replace(/^#+/, "").replace(/\s+/g, "").trim();
    const key = tag.toLowerCase();
    if (!tag || !HASHTAG_OK.test(tag) || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

export const instagramCaption = defineFormat<CaptionRaw>({
  format: "instagram_caption",
  kind: "caption",
  schemaName: "InstagramCaption",
  schema: CaptionRawSchema,
  instructions: `### Format key: instagram_caption
Produce \`body\` (≤ 1,500 characters) and \`hashtags\` (5–8 strings, without the # symbol).
- Line one is the hook, under 125 characters — that's all that shows before "more".
- Short lines with blank lines between thoughts. Direct and warm, adjusted to the voice. Emojis only if the voice uses them.
- Hashtags must be specific to the topic (never #love #instagood #motivation). Return them in \`hashtags\` only — never inside \`body\`.`,
  finalize: ({ body, hashtags }) => {
    const tags = cleanHashtags(hashtags);
    const reserve = tags.reduce((n, t) => n + t.length + 2, 0);
    return {
      kind: "caption",
      body: truncateAtBoundary(
        requireText(
          normalizeText(body)
            .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1")
            .trim(),
          40,
          "Caption",
        ),
        INSTAGRAM_MAX_CHARS - reserve,
      ),
      hashtags: tags,
    };
  },
});
