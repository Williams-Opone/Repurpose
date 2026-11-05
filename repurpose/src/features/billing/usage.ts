import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { usage } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { currentPeriod, type Entitlements } from "./quota";

export async function getUsedCount(userId: string, period = currentPeriod()): Promise<number> {
  const row = await db.query.usage.findFirst({
    where: and(eq(usage.userId, userId), eq(usage.period, period)),
    columns: { count: true },
  });
  return row?.count ?? 0;
}

/**
 * Atomically take one generation from the user's monthly allowance.
 * One conditional upsert: `count = count + 1 WHERE count < limit`. If the row isn't
 * returned, the limit was hit — two concurrent requests can never both pass.
 */
export async function reserveGeneration(userId: string, ent: Entitlements): Promise<void> {
  if (ent.limit !== null && ent.limit <= 0) throw new AppError("QUOTA_EXCEEDED");

  const rows = await db
    .insert(usage)
    .values({ userId, period: ent.period, count: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.period],
      set: { count: sql`${usage.count} + 1`, updatedAt: new Date() },
      setWhere: ent.limit === null ? undefined : lt(usage.count, ent.limit),
    })
    .returning({ count: usage.count });

  if (rows.length === 0) throw new AppError("QUOTA_EXCEEDED");
}

/** Give one back (floored at zero). Called when a generation fails entirely. */
export async function refundGeneration(userId: string, period = currentPeriod()): Promise<void> {
  await db
    .update(usage)
    .set({ count: sql`GREATEST(${usage.count} - 1, 0)`, updatedAt: new Date() })
    .where(and(eq(usage.userId, userId), eq(usage.period, period)));
  logger.info("generation refunded", { userId, period });
}
