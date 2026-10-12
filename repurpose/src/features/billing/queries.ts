import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";

import { getBillingProvider, type InvoiceSummary } from "./provider";

export const getSubscription = cache(async (userId: string) => {
  const row = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) });
  return row ?? null;
});

/** Live from the provider — we never mirror invoices. Never throws. */
export async function listInvoices(userId: string): Promise<InvoiceSummary[]> {
  const sub = await getSubscription(userId);
  if (!sub) return [];
  return getBillingProvider().listInvoices(sub);
}
