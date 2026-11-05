import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { PLAN_CACHE_TTL_S } from "@/lib/constants";
import { redis } from "@/lib/redis";
import type { Plan } from "@/types";

import { computeEntitlements, effectivePlan, type Entitlements } from "./quota";
import { getUsedCount } from "./usage";

const planKey = (userId: string) => `plan:${userId}`;

export async function getPlan(userId: string): Promise<Plan> {
  const cached = await redis.get<Plan>(planKey(userId));
  if (cached === "free" || cached === "pro") return cached;

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true, status: true },
  });
  const plan = effectivePlan(sub);
  await redis.set(planKey(userId), plan, { ex: PLAN_CACHE_TTL_S });
  return plan;
}

/** Phase 9: called from the Stripe webhook so upgrades apply instantly. */
export async function invalidatePlanCache(userId: string): Promise<void> {
  await redis.del(planKey(userId));
}

/** Single source of truth for "can this user generate, and how many are left". */
export const getEntitlements = cache(async (userId: string): Promise<Entitlements> => {
  const [plan, used] = await Promise.all([getPlan(userId), getUsedCount(userId)]);
  return computeEntitlements({ plan, used });
});
