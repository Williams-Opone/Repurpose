"use client";

import { useState, useTransition } from "react";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BillingInterval } from "@/types";

import { createCheckout } from "../actions";
import { formatPrice, PLAN_COPY } from "../plans";
import { IntervalToggle } from "./interval-toggle";

export function UpgradeSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [pending, start] = useTransition();
  const pro = PLAN_COPY.pro;

  function checkout() {
    start(async () => {
      const res = await createCheckout({ interval });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      window.location.href = res.data.url; // leaving the app: full navigation
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl float">
        <SheetHeader className="gap-2">
          <SheetTitle className="font-serif text-3xl">
            That&apos;s all five for this month.
          </SheetTitle>
          <SheetDescription>
            Your voices, history, and edits stay exactly where they are. Pro removes the ceiling.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          <IntervalToggle value={interval} onChange={setInterval} />

          <p className="flex items-baseline gap-2">
            <span className="font-mono text-4xl tabular-nums">
              {formatPrice(pro.price[interval])}
            </span>
            <span className="text-fg-2">/ {interval}</span>
          </p>

          <StaggerContainer className="flex flex-col gap-2">
            {pro.features.map((f) => (
              <StaggerItem key={f} className="flex items-start gap-2 text-sm text-fg-1">
                <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                {f}
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Button size="lg" onClick={checkout} disabled={pending}>
            <Zap />
            {pending ? "Opening checkout…" : "Upgrade to Pro"}
          </Button>
          <p className="text-center text-xs text-fg-2">
            Cancel any time. Test mode — no real charge.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
