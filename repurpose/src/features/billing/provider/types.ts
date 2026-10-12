import type { BillingInterval, BillingProviderId, SubscriptionStatus } from "@/types";

/** What a provider tells us about a subscription. The DB mirrors this. */
export type RemoteSubscription = {
  providerSubscriptionId: string;
  providerCustomerId: string;
  providerPlanId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  meta?: Record<string, string>;
};

export type InvoiceSummary = {
  id: string;
  amount: number; // major units
  currency: string;
  status: "paid" | "failed" | "pending";
  created: Date;
  receiptUrl: string | null;
};

export type CheckoutArgs = {
  userId: string;
  email: string;
  name: string | null;
  interval: BillingInterval;
  callbackUrl: string;
};

export type StoredSubscription = {
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  providerMeta: Record<string, string> | null;
};

/** A verified, normalized webhook. `id` must be stable for idempotency. */
export type BillingEvent =
  | { id: string; type: "subscription.active"; subscription: RemoteSubscription }
  | { id: string; type: "subscription.ended"; providerSubscriptionId: string }
  | { id: string; type: "payment.failed"; providerSubscriptionId: string | null }
  | { id: string; type: "ignored"; rawType: string };

export interface BillingProvider {
  readonly id: BillingProviderId;
  /** Hosted checkout URL. The client navigates to it. */
  createCheckout(args: CheckoutArgs): Promise<{ url: string }>;
  /** Hosted "manage subscription" page, if the provider has one. */
  createManageLink(sub: StoredSubscription): Promise<{ url: string } | null>;
  /** Cancel at period end. */
  cancel(sub: StoredSubscription): Promise<void>;
  /** Re-read from the provider — never trust a webhook payload alone. */
  fetchSubscription(providerSubscriptionId: string): Promise<RemoteSubscription | null>;
  listInvoices(sub: StoredSubscription): Promise<InvoiceSummary[]>;
  /** Verify the signature over the RAW body and normalize. Returns null if invalid. */
  parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent | null>;
}
