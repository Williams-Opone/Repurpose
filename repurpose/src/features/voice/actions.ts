"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { brandVoices, voiceSamples } from "@/db/schema";
import { MAX_VOICES_PER_USER, MAX_VOICE_SAMPLES, MIN_VOICE_SAMPLES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { authedAction } from "@/lib/safe-action";

import { requireOwnedVoice } from "./queries";
import {
  AddSampleSchema,
  CreateVoiceSchema,
  RemoveSampleSchema,
  RenameVoiceSchema,
  VoiceIdSchema,
} from "./schema";

export const createVoice = authedAction(
  CreateVoiceSchema,
  async ({ name, samples }, { userId }) => {
    const existing = await db.query.brandVoices.findMany({
      where: eq(brandVoices.userId, userId),
      columns: { id: true },
    });
    if (existing.length >= MAX_VOICES_PER_USER) {
      throw new AppError("INVALID_INPUT", `You can have up to ${MAX_VOICES_PER_USER} voices.`);
    }

    // Pre-mint the id so both inserts go in one atomic batch.
    const voiceId = crypto.randomUUID();
    await db.batch([
      db
        .insert(brandVoices)
        .values({ id: voiceId, userId, name, isDefault: existing.length === 0 }),
      db.insert(voiceSamples).values(samples.map((s) => ({ voiceId, ...s }))),
    ]);

    revalidatePath("/voice");
    return { voiceId };
  },
);

export const addSample = authedAction(AddSampleSchema, async ({ voiceId, sample }, { userId }) => {
  const voice = await requireOwnedVoice(voiceId, userId);
  if (voice.samples.length >= MAX_VOICE_SAMPLES) {
    throw new AppError("INVALID_INPUT", `A voice can hold up to ${MAX_VOICE_SAMPLES} samples.`);
  }
  const [row] = await db
    .insert(voiceSamples)
    .values({ voiceId, ...sample })
    .returning({ id: voiceSamples.id });
  if (!row) throw new AppError("INTERNAL");

  revalidatePath(`/voice/${voiceId}`);
  return { sampleId: row.id };
});

export const removeSample = authedAction(
  RemoveSampleSchema,
  async ({ voiceId, sampleId }, { userId }) => {
    const voice = await requireOwnedVoice(voiceId, userId);
    if (voice.samples.length <= MIN_VOICE_SAMPLES) {
      throw new AppError("INVALID_INPUT", `Keep at least ${MIN_VOICE_SAMPLES} samples.`);
    }
    await db
      .delete(voiceSamples)
      .where(and(eq(voiceSamples.id, sampleId), eq(voiceSamples.voiceId, voiceId)));

    revalidatePath(`/voice/${voiceId}`);
    return { ok: true as const };
  },
);

export const renameVoice = authedAction(
  RenameVoiceSchema,
  async ({ voiceId, name }, { userId }) => {
    await requireOwnedVoice(voiceId, userId);
    await db.update(brandVoices).set({ name }).where(eq(brandVoices.id, voiceId));
    revalidatePath("/voice");
    return { ok: true as const };
  },
);

export const setDefaultVoice = authedAction(VoiceIdSchema, async ({ voiceId }, { userId }) => {
  await requireOwnedVoice(voiceId, userId);
  await db.batch([
    db.update(brandVoices).set({ isDefault: false }).where(eq(brandVoices.userId, userId)),
    db.update(brandVoices).set({ isDefault: true }).where(eq(brandVoices.id, voiceId)),
  ]);
  revalidatePath("/voice");
  return { ok: true as const };
});

export const deleteVoice = authedAction(VoiceIdSchema, async ({ voiceId }, { userId }) => {
  const voice = await requireOwnedVoice(voiceId, userId);
  await db.delete(brandVoices).where(eq(brandVoices.id, voiceId)); // samples cascade

  // Never leave the user without a default if they still have voices.
  if (voice.isDefault) {
    const next = await db.query.brandVoices.findFirst({
      where: eq(brandVoices.userId, userId),
      orderBy: [desc(brandVoices.updatedAt)],
      columns: { id: true },
    });
    if (next) {
      await db.update(brandVoices).set({ isDefault: true }).where(eq(brandVoices.id, next.id));
    }
  }

  revalidatePath("/voice");
  return { ok: true as const };
});
