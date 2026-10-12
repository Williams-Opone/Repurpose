import { notFound, redirect } from "next/navigation";

import { applyRemoteSubscription, getBillingProvider } from "@/features/billing";
import { requireUserId } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata = { title: "Checkout" };

/** Stands in for a hosted checkout when BILLING_PROVIDER=mock. */
export default async function MockCheckoutPage() {
  if (env.BILLING_PROVIDER !== "mock") notFound();

  const userId = await requireUserId();
  const remote = await getBillingProvider().fetchSubscription(`mock_sub_${userId}`);
  if (remote) await applyRemoteSubscription(remote, userId);

  redirect("/billing?checkout=success");
}
