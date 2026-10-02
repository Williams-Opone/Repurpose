import { z } from "zod";

import { MAX_SOURCE_CHARS, MIN_SOURCE_WORDS } from "@/lib/constants";
import { SOURCE_TYPES } from "@/types";

import type { Source } from "./types";

export const SourceSchema = z.object({
  type: z.enum(SOURCE_TYPES),
  title: z.string().max(200).nullable(),
  url: z.url().nullable(),
  text: z
    .string()
    .trim()
    .min(1, "Add some content first.")
    .max(MAX_SOURCE_CHARS, "That's more text than we can take in one go."),
  wordCount: z
    .number()
    .int()
    .min(MIN_SOURCE_WORDS, `Give us at least ${MIN_SOURCE_WORDS} words to work with.`),
  truncated: z.boolean(),
  thumbnailUrl: z.url().nullable(),
  author: z.string().max(200).nullable(),
}) satisfies z.ZodType<Source>;

// Not z.url(): we accept "youtu.be/abc" without a scheme; detect.ts normalizes it.
export const FetchSourceSchema = z.object({
  url: z.string().trim().min(1, "Paste a link.").max(2_048),
});
