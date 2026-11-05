"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { outputs } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { authedAction } from "@/lib/safe-action";

import { FORMAT_REGISTRY } from "./prompts/formats";
import { requireOwnedOutput } from "./queries";
import { OutputIdSchema, SaveEditSchema } from "./schema";

/** Persist user edits. Saving content identical to the AI original clears the edit. */
export const saveEdit = authedAction(SaveEditSchema, async ({ outputId, content }, { userId }) => {
  const row = await requireOwnedOutput(outputId, userId);
  if (content.kind !== FORMAT_REGISTRY[row.format].kind) {
    throw new AppError("INVALID_INPUT", "That edit doesn't match the output's format.");
  }
  const unchanged = JSON.stringify(content) === JSON.stringify(row.content);
  await db
    .update(outputs)
    .set({ editedContent: unchanged ? null : content })
    .where(eq(outputs.id, outputId));
  return { edited: !unchanged };
});

export const resetOutput = authedAction(OutputIdSchema, async ({ outputId }, { userId }) => {
  await requireOwnedOutput(outputId, userId);
  await db.update(outputs).set({ editedContent: null }).where(eq(outputs.id, outputId));
  return { ok: true as const };
});
