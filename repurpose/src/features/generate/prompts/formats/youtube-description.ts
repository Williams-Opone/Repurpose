import { z } from "zod";

import { YOUTUBE_DESCRIPTION_MAX_CHARS } from "@/lib/constants";

import { normalizeText, requireText, truncateAtBoundary } from "./shared";
import { defineFormat } from "./types";

export const DescriptionRawSchema = z.object({
  body: z.string().describe("YouTube description, 600–1,500 characters, plain text."),
});
export type DescriptionRaw = z.infer<typeof DescriptionRawSchema>;

export const youtubeDescription = defineFormat<DescriptionRaw>({
  format: "youtube_description",
  kind: "description",
  schemaName: "YouTubeDescription",
  schema: DescriptionRawSchema,
  instructions: `### Format key: youtube_description
Produce \`body\` (600–1,500 characters, plain text).
- First two lines: what the video is about and who it's for, in plain language including the main keyword — these show above "Show more".
- Then a 3–6 sentence summary of what's covered, in the author's voice.
- Then, ONLY if the source clearly breaks into sections, a line reading exactly \`Timestamps:\` followed by placeholder lines like \`00:00 Intro\` using the section names. Otherwise omit the timestamps block entirely.
- No link lists, no "like and subscribe" paragraph, no hashtag wall.`,
  finalize: ({ body }) => ({
    kind: "description",
    body: truncateAtBoundary(
      requireText(normalizeText(body), 150, "YouTube description"),
      YOUTUBE_DESCRIPTION_MAX_CHARS,
    ),
  }),
});
