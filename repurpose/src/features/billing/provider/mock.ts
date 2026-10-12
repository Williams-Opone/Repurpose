import "server-only";
import { createHash } from "node:crypto";

import { logger } from "@/lib/logger";
import type { SubscriptionStatus } from "@/types";

import type {
  BillingEvent,
  BillingProvider,
  CheckoutArgs,
  InvoiceSummary,
  RemoteSubscription,
  StoredSubscription,
} from "./types";

/**
 * No payment provider required. Checkout goes to a local page that posts a signed-shaped
 * webhook to ourselves. Used for local dev, CI/E2E, and the public demo account.
 */
function monthFromNow(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}

const subFor = (userId: string, status: SubscriptionStatus = "active"): RemoteSubscription => ({
  providerSubscriptionId: `mock_sub_${userId}`,
  providerCustomerId: `mock_cus_${userId}`,
  providerPlanId: "mock_plan_pro",
  status,
  currentPeriodEnd: monthFromNow(),
  cancelAtPeriodEnd: false,
  meta: { userId },
});

export const mockProvider: BillingProvider = {
  id: "mock",

  async createCheckout({ userId, interval, callbackUrl }: CheckoutArgs) {
    const url = new URL("/billing/mock-checkout", callbackUrl);
    url.searchParams.set("userId", userId);
    url.searchParams.set("interval", interval);
    logger.info("mock checkout created", { userId, interval });
    return { url: url.toString() };
  },

  async createManageLink() {
    return null; // the UI falls back to an in-app cancel button
  },

  async cancel(sub: StoredSubscription) {
    logger.info("mock subscription cancelled", { id: sub.providerSubscriptionId });
  },

  async fetchSubscription(providerSubscriptionId: string) {
    const userId = providerSubscriptionId.replace("mock_sub_", "");
    return subFor(userId);
  },

  async listInvoices(sub: StoredSubscription): Promise<InvoiceSummary[]> {
    if (!sub.providerSubscriptionId) return [];
    return [
      {
        id: "mock_inv_1",
        amount: 15_000,
        currency: "NGN",
        status: "paid",
        created: new Date(),
        receiptUrl: null,
      },
    ];
  },

  async parseWebhook(rawBody: string): Promise<BillingEvent | null> {
    const id = `mock_${createHash("sha256").update(rawBody).digest("hex").slice(0, 32)}`;
    const body = JSON.parse(rawBody) as { event?: string; userId?: string };
    if (!body.userId) return { id, type: "ignored", rawType: body.event ?? "unknown" };

    if (body.event === "subscription.ended") {
      return { id, type: "subscription.ended", providerSubscriptionId: `mock_sub_${body.userId}` };
    }
    return { id, type: "subscription.active", subscription: subFor(body.userId) };
  },
};
