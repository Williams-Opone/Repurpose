import "server-only";
import { cache } from "react";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { brandVoices, voiceSamples } from "@/db/schema";
import { AppError } from "@/lib/errors";

export const listVoices = cache(async (userId: string) =>
  db.query.brandVoices.findMany({
    where: eq(brandVoices.userId, userId),
    with: { samples: { columns: { id: true } } },
    orderBy: [desc(brandVoices.isDefault), desc(brandVoices.updatedAt)],
  }),
);
export type VoiceListItem = Awaited<ReturnType<typeof listVoices>>[number];

export const getVoice = cache(async (voiceId: string, userId: string) => {
  const voice = await db.query.brandVoices.findFirst({
    where: and(eq(brandVoices.id, voiceId), eq(brandVoices.userId, userId)),
    with: { samples: { orderBy: [asc(voiceSamples.createdAt)] } },
  });
  return voice ?? null;
});
export type VoiceWithSamples = NonNullable<Awaited<ReturnType<typeof getVoice>>>;

/** NOT_FOUND (not FORBIDDEN) on purpose: don't leak that another user's id exists. */
export async function requireOwnedVoice(
  voiceId: string,
  userId: string,
): Promise<VoiceWithSamples> {
  const voice = await getVoice(voiceId, userId);
  if (!voice) throw new AppError("NOT_FOUND", "That voice doesn't exist.");
  return voice;
}

export const getDefaultVoice = cache(async (userId: string) => {
  const voice = await db.query.brandVoices.findFirst({
    where: eq(brandVoices.userId, userId),
    with: { samples: true },
    orderBy: [desc(brandVoices.isDefault), desc(brandVoices.updatedAt)],
  });
  return voice ?? null;
});

export const hasAnyVoice = cache(async (userId: string) => {
  const row = await db.query.brandVoices.findFirst({
    where: eq(brandVoices.userId, userId),
    columns: { id: true },
  });
  return Boolean(row);
});
