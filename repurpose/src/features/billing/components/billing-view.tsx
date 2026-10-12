"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import type { Subscription } from "@/db/schema";
import type { BillingInterval } from "@/types";

import { cancelSubscription, createManageLink } from "../actions";
import { PLAN_COPY } from "../plans";
import type { InvoiceSummary } from "../provider";
import type { Entitlements } from "../quota";
import { IntervalToggle } from "./interval-toggle";
import { InvoiceList } from "./invoice-list";
import { PlanCard } from "./plan-card";
import { UpgradeSheet } from "./upgrade-sheet";

type Props = {
  entitlements: Entitlements;
  subscription: Subscription | null;
  invoices: InvoiceSummary[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function BillingView({ entitlements, subscription, invoices }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, start] = useTransition();
  const isPro = entitlements.plan === "pro";

  // After checkout the webhook may land a beat later — poll briefly.
  useEffect(() => {
    const checkout = params.get("checkout");
    if (!checkout) return;
    if (isPro) {
      toast.success("You're on Pro. Generate away.");
      router.replace("/billing");
      return;
    }
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [params, isPro, router]);

  function manage() {
    start(async () => {
      const res = await createManageLink({});
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      if (res.data.url) window.location.href = res.data.url;
      else toast("Use “Cancel subscription” below to stop renewals.");
    });
  }

  function cancel() {
    start(async () => {
      const res = await cancelSubscription({});
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Cancelled — you keep Pro until the period ends.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <Section title="Plan">
          {!isPro && <IntervalToggle value={interval} onChange={setInterval} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanCard plan={PLAN_COPY.free} interval={interval} current={!isPro} />
            <PlanCard
              plan={PLAN_COPY.pro}
              interval={interval}
              current={isPro}
              highlight={!isPro}
              action={
                isPro ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={manage}
                      disabled={pending}
                    >
                      Manage subscription <ExternalLink />
                    </Button>
                    {!subscription?.cancelAtPeriodEnd && (
                      <Button variant="ghost" size="sm" onClick={cancel} disabled={pending}>
                        Cancel subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setSheetOpen(true)}>
                    <Zap /> Upgrade to Pro
                  </Button>
                )
              }
            />
          </div>

          {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
            <FadeIn className="rounded-md surface-2 p-4 text-sm text-warning">
              Your subscription ends on{" "}
              {subscription.currentPeriodEnd.toLocaleDateString("en-NG", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              . You keep Pro until then.
            </FadeIn>
          )}
          {subscription?.status === "past_due" && (
            <FadeIn className="rounded-md surface-2 p-4 text-sm text-danger">
              Your last payment failed. Update your card to avoid losing Pro.
            </FadeIn>
          )}
        </Section>

        <Section title="Invoices">
          <InvoiceList invoices={invoices} />
        </Section>
      </div>

      <UpgradeSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
