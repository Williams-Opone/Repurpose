"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { authedAction } from "@/lib/safe-action";
import { BILLING_INTERVALS } from "@/types";
import { getUserEmail } from "@/lib/auth";
import { invalidatePlanCache } from "./entitlements";
import { getBillingProvider } from "./provider";
import { getSubscription } from "./queries";

const CheckoutSchema = z.object({ interval: z.enum(BILLING_INTERVALS) });

/** Returns a URL; the caller navigates. redirect() inside an action would be swallowed. */
export const createCheckout = authedAction(CheckoutSchema, async ({ interval }, { userId }) => {
  const { email, name } = await getUserEmail(userId);
  if (!email) {
    throw new AppError(
      "INVALID_INPUT",
      "We need an email address to start checkout. Add one under Manage account.",
    );
  }

  const { url } = await getBillingProvider().createCheckout({
    userId,
    email,
    name,
    interval,
    callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
  });
  return { url };
});

export const createManageLink = authedAction(z.object({}), async (_input, { userId }) => {
  const sub = await getSubscription(userId);
  if (!sub?.providerSubscriptionId) throw new AppError("NOT_FOUND", "No active subscription.");
  const link = await getBillingProvider().createManageLink(sub);
  return { url: link?.url ?? null };
});

export const cancelSubscription = authedAction(z.object({}), async (_input, { userId }) => {
  const sub = await getSubscription(userId);
  if (!sub?.providerSubscriptionId) throw new AppError("NOT_FOUND", "No active subscription.");

  await getBillingProvider().cancel(sub);
  // Optimistic: the webhook will confirm. Entitlement stays until the period ends.
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true })
    .where(eq(subscriptions.userId, userId));
  await invalidatePlanCache(userId);
  return { ok: true as const };
});
