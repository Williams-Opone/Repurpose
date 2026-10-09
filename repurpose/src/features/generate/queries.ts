import "server-only";
import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { generations, outputs } from "@/db/schema";
import { AppError } from "@/lib/errors";

export const getGeneration = cache(async (generationId: string, userId: string) => {
  const row = await db.query.generations.findFirst({
    where: and(
      eq(generations.id, generationId),
      eq(generations.userId, userId),
      isNull(generations.deletedAt),
    ),
    with: {
      outputs: { orderBy: [asc(outputs.createdAt)] },
      voice: { columns: { id: true, name: true } },
    },
  });
  return row ?? null;
});
export type GenerationWithOutputs = NonNullable<Awaited<ReturnType<typeof getGeneration>>>;

export async function requireOwnedGeneration(generationId: string, userId: string) {
  const g = await getGeneration(generationId, userId);
  if (!g) throw new AppError("NOT_FOUND", "That generation doesn't exist.");
  return g;
}

/** Ownership is checked through the parent generation. */
export async function requireOwnedOutput(outputId: string, userId: string) {
  const row = await db.query.outputs.findFirst({
    where: eq(outputs.id, outputId),
    with: { generation: true },
  });
  if (!row || row.generation.userId !== userId) {
    throw new AppError("NOT_FOUND", "That output doesn't exist.");
  }
  return row;
}
export type OutputWithGeneration = Awaited<ReturnType<typeof requireOwnedOutput>>;
