import { z } from "zod";

import {
  MAX_SAMPLE_CHARS,
  MAX_VOICE_SAMPLES,
  MIN_SAMPLE_CHARS,
  MIN_VOICE_SAMPLES,
} from "@/lib/constants";
import { PLATFORMS, type VoiceProfile } from "@/types";

/* ---------- AI output ---------- */

export const VoiceProfileSchema = z.object({
  tone: z
    .array(z.string())
    .describe("2–5 specific adjectives. Never generic words like 'engaging' or 'professional'."),
  sentenceLength: z.enum(["short", "mixed", "long"]).describe("Dominant sentence length."),
  vocabulary: z.object({
    favors: z
      .array(z.string())
      .describe("Concrete words/phrases the author actually uses. Quote them."),
    avoids: z
      .array(z.string())
      .describe("Patterns clearly absent, e.g. 'buzzwords', 'exclamation marks'."),
  }),
  structuralHabits: z
    .array(z.string())
    .describe(
      "How they open, build, close. e.g. 'opens with a one-line claim', 'ends without a CTA'.",
    ),
  formatting: z.object({
    emojis: z.enum(["never", "rare", "frequent"]),
    hashtags: z.boolean(),
    lists: z.boolean(),
  }),
  signaturePhrases: z
    .array(z.string())
    .describe("Verbatim recurring phrases or tics. Empty if none."),
  pointOfView: z.enum(["first-singular", "first-plural", "second", "mixed"]),
  summary: z
    .string()
    .describe(
      "2–3 sentences in second person ('You write like…'), under 60 words. Shown to the author.",
    ),
}) satisfies z.ZodType<VoiceProfile>;

/* ---------- Inputs ---------- */

export const SampleInputSchema = z.object({
  platform: z.enum(PLATFORMS),
  content: z
    .string()
    .trim()
    .min(
      MIN_SAMPLE_CHARS,
      `Paste at least ${MIN_SAMPLE_CHARS} characters so there's something to learn from.`,
    )
    .max(
      MAX_SAMPLE_CHARS,
      `Keep each sample under ${MAX_SAMPLE_CHARS.toLocaleString()} characters.`,
    ),
});
export type SampleInput = z.infer<typeof SampleInputSchema>;

export const VoiceNameSchema = z.string().trim().min(1, "Give this voice a name.").max(40);

export const CreateVoiceSchema = z.object({
  name: VoiceNameSchema,
  samples: z
    .array(SampleInputSchema)
    .min(MIN_VOICE_SAMPLES, `Add at least ${MIN_VOICE_SAMPLES} samples.`)
    .max(MAX_VOICE_SAMPLES),
});

export const VoiceIdSchema = z.object({ voiceId: z.uuid() });
export const AddSampleSchema = VoiceIdSchema.extend({ sample: SampleInputSchema });
export const RemoveSampleSchema = VoiceIdSchema.extend({ sampleId: z.uuid() });
export const RenameVoiceSchema = VoiceIdSchema.extend({ name: VoiceNameSchema });

/* ---------- Labels (UI) ---------- */

export const POV_LABELS: Record<VoiceProfile["pointOfView"], string> = {
  "first-singular": "First person (I)",
  "first-plural": "First person plural (we)",
  second: "Second person (you)",
  mixed: "Mixed",
};

export const SENTENCE_LABELS: Record<VoiceProfile["sentenceLength"], string> = {
  short: "Short, punchy",
  mixed: "Mixed rhythm",
  long: "Long, flowing",
};
