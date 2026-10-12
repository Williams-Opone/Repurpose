import { Suspense } from "react";

import { Topbar } from "@/components/layout/topbar";
import { getEntitlements, getSubscription, listInvoices } from "@/features/billing";
import { BillingView } from "@/features/billing/components/billing-view";
import { UsageBar } from "@/features/billing/components/usage-bar";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const userId = await requireUserId();
  const [entitlements, subscription, invoices] = await Promise.all([
    getEntitlements(userId),
    getSubscription(userId),
    listInvoices(userId),
  ]);

  return (
    <>
      <Topbar title="Billing" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto mb-10 max-w-3xl">
          <UsageBar entitlements={entitlements} />
        </div>
        {/* useSearchParams needs a Suspense boundary */}
        <Suspense>
          <BillingView
            entitlements={entitlements}
            subscription={subscription}
            invoices={invoices}
          />
        </Suspense>
      </main>
    </>
  );
}
