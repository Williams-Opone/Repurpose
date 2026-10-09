"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { generations } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { authedAction } from "@/lib/safe-action";

const GenerationIdSchema = z.object({ generationId: z.uuid() });

/** Soft delete. The undo toast calls restoreGeneration — durable, unlike a server-side timer. */
export const deleteGeneration = authedAction(
  GenerationIdSchema,
  async ({ generationId }, { userId }) => {
    const rows = await db
      .update(generations)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(generations.id, generationId),
          eq(generations.userId, userId),
          isNull(generations.deletedAt),
        ),
      )
      .returning({ id: generations.id });

    if (rows.length === 0) throw new AppError("NOT_FOUND", "That generation doesn't exist.");
    revalidatePath("/history");
    return { ok: true as const };
  },
);

export const restoreGeneration = authedAction(
  GenerationIdSchema,
  async ({ generationId }, { userId }) => {
    const rows = await db
      .update(generations)
      .set({ deletedAt: null })
      .where(and(eq(generations.id, generationId), eq(generations.userId, userId)))
      .returning({ id: generations.id });

    if (rows.length === 0) throw new AppError("NOT_FOUND", "We couldn't bring that one back.");
    revalidatePath("/history");
    return { ok: true as const };
  },
);
