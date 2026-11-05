import { z } from "zod";

import { NEWSLETTER_SUBJECT_MAX_CHARS } from "@/lib/constants";

import { normalizeText, requireText, truncateAtBoundary } from "./shared";
import { defineFormat } from "./types";

export const NewsletterRawSchema = z.object({
  subject: z.string().describe("Subject line, ≤ 60 characters, specific, no clickbait, no emoji."),
  body: z
    .string()
    .describe("300–600 words. Markdown allowed: **bold**, lists, plain-text subheads."),
});
export type NewsletterRaw = z.infer<typeof NewsletterRawSchema>;

export const newsletterSection = defineFormat<NewsletterRaw>({
  format: "newsletter_section",
  kind: "newsletter",
  schemaName: "NewsletterSection",
  schema: NewsletterRawSchema,
  instructions: `### Format key: newsletter_section
Produce \`subject\` (≤ 60 characters, specific, no clickbait) and \`body\` (300–600 words).
- Conversational, like a letter from the author to one reader. Open directly on the idea — no "Hey friends, hope you're well."
- Skimmable: short paragraphs; a plain-text subhead or a short list only where the content genuinely calls for it.
- Keep the source's specifics (numbers, names, examples). Do not add new facts.
- End with one concrete takeaway or next step. Markdown allowed: **bold**, lists. Links only if they appear in the source.`,
  finalize: ({ subject, body }) => ({
    kind: "newsletter",
    subject: truncateAtBoundary(
      requireText(subject.replace(/\s+/g, " "), 3, "Subject line"),
      NEWSLETTER_SUBJECT_MAX_CHARS,
    ),
    body: requireText(normalizeText(body), 200, "Newsletter body"),
  }),
});
