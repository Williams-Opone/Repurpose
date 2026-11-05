import type { Subscription } from "@/db/schema";
import { FREE_QUOTA_PER_MONTH } from "@/lib/constants";
import type { Plan } from "@/types";

/** "YYYY-MM" in UTC — the usage table's partition key. */
export function currentPeriod(now = new Date()): string {
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${m}`;
}

const ENTITLED_STATUSES = new Set<Subscription["status"]>(["active", "trialing", "past_due"]);

/** A "pro" row only counts if Stripe says it's in good standing (past_due = grace). */
export function effectivePlan(sub: Pick<Subscription, "plan" | "status"> | null | undefined): Plan {
  if (!sub || sub.plan !== "pro") return "free";
  return ENTITLED_STATUSES.has(sub.status) ? "pro" : "free";
}

export type Entitlements = {
  plan: Plan;
  period: string;
  used: number;
  /** null = unlimited */
  limit: number | null;
  /** null = unlimited */
  remaining: number | null;
  unlimited: boolean;
};

export function computeEntitlements(args: { plan: Plan; used: number; now?: Date }): Entitlements {
  const unlimited = args.plan === "pro";
  const limit = unlimited ? null : FREE_QUOTA_PER_MONTH;
  return {
    plan: args.plan,
    period: currentPeriod(args.now),
    used: args.used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - args.used),
    unlimited,
  };
}
