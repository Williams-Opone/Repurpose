import { z } from "zod";

import { LINKEDIN_MAX_CHARS } from "@/lib/constants";

import { normalizeText, requireText, truncateAtBoundary } from "./shared";
import { defineFormat } from "./types";

export const PostRawSchema = z.object({
  body: z
    .string()
    .describe("The complete LinkedIn post, 900–1,800 characters, blank lines between paragraphs."),
});
export type PostRaw = z.infer<typeof PostRawSchema>;

export const linkedinPost = defineFormat<PostRaw>({
  format: "linkedin_post",
  kind: "post",
  schemaName: "LinkedInPost",
  schema: PostRawSchema,
  instructions: `### Format key: linkedin_post
Produce \`body\`: one LinkedIn post, 900–1,800 characters.
- The first line is the hook and must work when cut at ~140 characters ("…see more"). Never "I'm excited to share" or "I've been thinking a lot about".
- Short paragraphs (1–2 sentences) with a blank line between them. At most one short list, and only if the voice uses lists.
- Shape: specific moment or claim → what actually happened / the evidence → one clear takeaway.
- Human, not corporate, unless the voice is corporate. Close on the point. End with a question only if the author's structural habits include it.
- Max 3 hashtags, at the very end, only if the voice uses hashtags.`,
  finalize: ({ body }) => ({
    kind: "post",
    body: truncateAtBoundary(
      requireText(normalizeText(body), 120, "LinkedIn post"),
      LINKEDIN_MAX_CHARS,
    ),
  }),
});
