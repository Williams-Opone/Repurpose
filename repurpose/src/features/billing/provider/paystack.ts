import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { BillingInterval, SubscriptionStatus } from "@/types";

import { PRO_PRICE } from "../plans";
import type {
  BillingEvent,
  BillingProvider,
  CheckoutArgs,
  InvoiceSummary,
  RemoteSubscription,
  StoredSubscription,
} from "./types";

const API = "https://api.paystack.co";

const planCodes = (): Record<BillingInterval, string> => ({
  month: env.PAYSTACK_PLAN_PRO_MONTHLY!,
  year: env.PAYSTACK_PLAN_PRO_YEARLY!,
});

/* ---------- Response shapes (validated, never trusted) ---------- */

const Envelope = z.object({ status: z.boolean(), message: z.string().optional() });

const InitializeData = z.object({ authorization_url: z.url(), reference: z.string() });

const SubscriptionData = z.object({
  subscription_code: z.string(),
  email_token: z.string().optional(),
  status: z.string(),
  next_payment_date: z.string().nullable().optional(),
  customer: z.object({ customer_code: z.string(), id: z.number().optional() }),
  plan: z.object({ plan_code: z.string() }).nullable().optional(),
  invoices: z
    .array(
      z.object({
        id: z.number(),
        amount: z.number(),
        status: z.string().optional(),
        paid: z.union([z.boolean(), z.number()]).optional(),
        createdAt: z.string().optional(),
        created_at: z.string().optional(),
      }),
    )
    .optional(),
});
type SubscriptionJson = z.infer<typeof SubscriptionData>;

const ManageLinkData = z.object({ link: z.url() });

/* ---------- HTTP ---------- */

async function call<T>(
  path: string,
  schema: z.ZodType<T>,
  // Omit, not intersect: RequestInit["body"] is BodyInit, which rejects plain objects.
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY) throw new AppError("INTERNAL", "Billing is not configured.");

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "content-type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch (e) {
    logger.error("paystack unreachable", { path, cause: String(e) });
    throw new AppError("PROVIDER_ERROR", "We couldn't reach the payment provider. Try again.");
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    logger.error("paystack returned non-JSON", {
      path,
      status: res.status,
      contentType: res.headers.get("content-type"),
      body: text.slice(0, 400),
    });
    throw new AppError("PROVIDER_ERROR", "Our payment provider returned something unexpected.");
  }

  const envelope = Envelope.safeParse(json);

  if (!res.ok || !envelope.success || !envelope.data.status) {
    logger.error("paystack call failed", {
      path,
      status: res.status,
      message: envelope.success ? envelope.data.message : "envelope shape mismatch",
      body: text.slice(0, 400),
    });
    throw new AppError(
      "PROVIDER_ERROR",
      "Our payment provider had a problem. Try again in a moment.",
    );
  }

  const parsed = schema.safeParse((json as { data: unknown }).data);
  if (!parsed.success) {
    logger.error("paystack response shape changed", {
      path,
      issues: parsed.error.issues.slice(0, 3),
      body: text.slice(0, 400),
    });
    throw new AppError("PROVIDER_ERROR", "Our payment provider returned something unexpected.");
  }
  return parsed.data;
}

/* ---------- Mapping ---------- */

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  "non-renewing": "active", // cancelled but paid through the current period
  attention: "past_due",
  completed: "canceled",
  cancelled: "canceled",
};

function toRemote(s: SubscriptionJson): RemoteSubscription {
  const status = STATUS_MAP[s.status] ?? "canceled";
  return {
    providerSubscriptionId: s.subscription_code,
    providerCustomerId: s.customer.customer_code,
    providerPlanId: s.plan?.plan_code ?? null,
    status,
    currentPeriodEnd: s.next_payment_date ? new Date(s.next_payment_date) : null,
    cancelAtPeriodEnd: s.status === "non-renewing",
    meta: {
      // email_token is REQUIRED to cancel later — losing it means manual support.
      ...(s.email_token ? { emailToken: s.email_token } : {}),
      ...(s.customer.id ? { customerId: String(s.customer.id) } : {}),
    },
  };
}

/* ---------- Provider ---------- */

export const paystackProvider: BillingProvider = {
  id: "paystack",

  async createCheckout({ userId, email, interval, callbackUrl }: CheckoutArgs) {
    const data = await call("/transaction/initialize", InitializeData, {
      method: "POST",
      body: {
        email,
        amount: PRO_PRICE[interval] * 100, // kobo — Paystack validates this even with a plan
        plan: planCodes()[interval],
        callback_url: callbackUrl,
        metadata: { userId, interval },
      },
    });
    logger.info("paystack checkout initialized", { userId, interval, reference: data.reference });
    return { url: data.authorization_url };
  },

  async createManageLink(sub: StoredSubscription) {
    if (!sub.providerSubscriptionId) return null;
    const data = await call(
      `/subscription/${encodeURIComponent(sub.providerSubscriptionId)}/manage/link`,
      ManageLinkData,
    );
    return { url: data.link };
  },

  async cancel(sub: StoredSubscription) {
    const token = sub.providerMeta?.emailToken;
    if (!sub.providerSubscriptionId || !token) {
      throw new AppError("INVALID_INPUT", "We can't cancel that subscription automatically.");
    }
    await call("/subscription/disable", z.unknown(), {
      method: "POST",
      body: { code: sub.providerSubscriptionId, token },
    });
    logger.info("paystack subscription disabled", { code: sub.providerSubscriptionId });
  },

  async fetchSubscription(providerSubscriptionId: string) {
    try {
      const data = await call(
        `/subscription/${encodeURIComponent(providerSubscriptionId)}`,
        SubscriptionData,
      );
      return toRemote(data);
    } catch {
      return null;
    }
  },

  async listInvoices(sub: StoredSubscription): Promise<InvoiceSummary[]> {
    if (!sub.providerSubscriptionId) return [];
    try {
      const data = await call(
        `/subscription/${encodeURIComponent(sub.providerSubscriptionId)}`,
        SubscriptionData,
      );
      return (data.invoices ?? []).map((i) => ({
        id: String(i.id),
        amount: i.amount / 100, // kobo → naira
        currency: "NGN",
        status: i.paid ? "paid" : i.status === "pending" ? "pending" : "failed",
        created: new Date(i.createdAt ?? i.created_at ?? Date.now()),
        receiptUrl: null,
      }));
    } catch {
      return [];
    }
  },

  async parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent | null> {
    if (!env.PAYSTACK_SECRET_KEY) return null;

    const signature = headers.get("x-paystack-signature");
    if (!signature) return null;

    const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    // Paystack sends no event id, so the body hash is our idempotency key.
    const id = `ps_${createHash("sha256").update(rawBody).digest("hex").slice(0, 32)}`;

    let body: { event?: string; data?: unknown };
    try {
      body = JSON.parse(rawBody) as { event?: string; data?: unknown };
    } catch {
      return null;
    }
    const type = body.event ?? "unknown";

    switch (type) {
      case "subscription.create":
      case "charge.success":
      case "invoice.update":
      case "invoice.create": {
        // Re-fetch rather than trusting the payload: events arrive out of order.
        const parsed = SubscriptionData.safeParse(body.data);
        const code = parsed.success
          ? parsed.data.subscription_code
          : ((body.data as { subscription?: { subscription_code?: string } } | undefined)
              ?.subscription?.subscription_code ?? null);
        if (!code) return { id, type: "ignored", rawType: type };

        const remote = await paystackProvider.fetchSubscription(code);
        return remote
          ? { id, type: "subscription.active", subscription: remote }
          : { id, type: "ignored", rawType: type };
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const parsed = SubscriptionData.safeParse(body.data);
        if (!parsed.success) return { id, type: "ignored", rawType: type };

        const remote = await paystackProvider.fetchSubscription(parsed.data.subscription_code);
        // "non-renewing" is cancelled but still entitled until the period ends.
        if (remote && remote.cancelAtPeriodEnd && remote.status === "active") {
          return { id, type: "subscription.active", subscription: remote };
        }
        return {
          id,
          type: "subscription.ended",
          providerSubscriptionId: parsed.data.subscription_code,
        };
      }

      case "invoice.payment_failed": {
        const sub = (body.data as { subscription?: { subscription_code?: string } } | undefined)
          ?.subscription?.subscription_code;
        return { id, type: "payment.failed", providerSubscriptionId: sub ?? null };
      }

      default:
        return { id, type: "ignored", rawType: type };
    }
  },
};
