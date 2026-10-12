import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { logger } from "@/lib/logger";

import { invalidatePlanCache } from "./entitlements";
import { getBillingProvider, type RemoteSubscription } from "./provider";

/** Find our user from a provider subscription id. */
async function userIdFor(providerSubscriptionId: string): Promise<string | null> {
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.providerSubscriptionId, providerSubscriptionId),
    columns: { userId: true },
  });
  if (row) return row.userId;
  // Mock provider encodes the user id; Paystack carries it in metadata we stored at checkout.
  const mock = providerSubscriptionId.startsWith("mock_sub_")
    ? providerSubscriptionId.replace("mock_sub_", "")
    : null;
  return mock;
}

/** THE single writer of subscription state. Always from provider truth, never a payload. */
export async function applyRemoteSubscription(
  remote: RemoteSubscription,
  hintUserId?: string | null,
): Promise<void> {
  const userId =
    hintUserId ?? remote.meta?.userId ?? (await userIdFor(remote.providerSubscriptionId));
  if (!userId) {
    logger.warn("billing: no user for subscription", { id: remote.providerSubscriptionId });
    return;
  }

  const entitled =
    remote.status === "active" || remote.status === "trialing" || remote.status === "past_due";

  await db
    .update(subscriptions)
    .set({
      plan: entitled ? "pro" : "free",
      status: remote.status,
      provider: getBillingProvider().id,
      providerCustomerId: remote.providerCustomerId,
      providerSubscriptionId: remote.providerSubscriptionId,
      providerPlanId: remote.providerPlanId,
      providerMeta: remote.meta ?? null,
      currentPeriodEnd: remote.currentPeriodEnd,
      cancelAtPeriodEnd: remote.cancelAtPeriodEnd,
    })
    .where(eq(subscriptions.userId, userId));

  await invalidatePlanCache(userId); // without this, an upgrade looks broken for 60s
  logger.info("subscription synced", {
    userId,
    plan: entitled ? "pro" : "free",
    status: remote.status,
  });
}

export async function endSubscription(providerSubscriptionId: string): Promise<void> {
  const userId = await userIdFor(providerSubscriptionId);
  if (!userId) return;

  await db
    .update(subscriptions)
    .set({
      plan: "free",
      status: "canceled",
      providerSubscriptionId: null,
      providerPlanId: null,
      providerMeta: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    })
    .where(eq(subscriptions.userId, userId));

  await invalidatePlanCache(userId);
  logger.info("subscription ended", { userId });
}

export async function notePaymentFailure(providerSubscriptionId: string | null): Promise<void> {
  if (!providerSubscriptionId) return;
  const userId = await userIdFor(providerSubscriptionId);
  if (!userId) return;
  await db
    .update(subscriptions)
    .set({ status: "past_due" })
    .where(eq(subscriptions.userId, userId));
  await invalidatePlanCache(userId);
  logger.warn("payment failed", { userId });
}
