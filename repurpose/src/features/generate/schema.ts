import { z } from "zod";

import { SourceSchema } from "@/features/ingest/schema";
import { MAX_FORMATS_PER_GENERATION, MAX_INSTRUCTION_CHARS } from "@/lib/constants";
import { FORMATS, type OutputContent } from "@/types";

const FormatEnum = z.enum(FORMATS);

/* ---------- Stored output shape ---------- */

export const OutputContentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("thread"), tweets: z.array(z.string()) }),
  z.object({ kind: z.literal("post"), body: z.string() }),
  z.object({ kind: z.literal("newsletter"), subject: z.string(), body: z.string() }),
  z.object({ kind: z.literal("caption"), body: z.string(), hashtags: z.array(z.string()) }),
  z.object({ kind: z.literal("description"), body: z.string() }),
]) satisfies z.ZodType<OutputContent>;

/* ---------- Requests ---------- */

const FormatsSchema = z
  .array(FormatEnum)
  .min(1, "Pick at least one format.")
  .max(MAX_FORMATS_PER_GENERATION, `Up to ${MAX_FORMATS_PER_GENERATION} formats at a time.`)
  .refine((fs) => new Set(fs).size === fs.length, "Each format can only be picked once.");

export const GenerateRequestSchema = z.object({
  source: SourceSchema,
  formats: FormatsSchema,
  voiceId: z.uuid().nullable().default(null),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const InstructionSchema = z
  .string()
  .trim()
  .max(MAX_INSTRUCTION_CHARS, `Keep directions under ${MAX_INSTRUCTION_CHARS} characters.`);

export const RegenerateRequestSchema = z.object({
  format: FormatEnum,
  instruction: InstructionSchema.optional(),
});

export const OutputIdSchema = z.object({ outputId: z.uuid() });
export const SaveEditSchema = OutputIdSchema.extend({ content: OutputContentSchema });

/* ---------- Stream protocol ---------- */

export const StreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), generationId: z.uuid(), formats: z.array(FormatEnum) }),
  z.object({ type: z.literal("partial"), format: FormatEnum, payload: z.unknown() }),
  z.object({
    type: z.literal("done"),
    format: FormatEnum,
    outputId: z.uuid(),
    content: OutputContentSchema,
    tokensUsed: z.number().nullable(),
  }),
  z.object({ type: z.literal("error"), format: FormatEnum, message: z.string() }),
  z.object({
    type: z.literal("complete"),
    status: z.enum(["complete", "failed"]),
    failedFormats: z.array(FormatEnum),
  }),
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;
