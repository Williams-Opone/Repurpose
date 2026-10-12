"use client";

import { Check } from "lucide-react";

import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/types";

import { formatPrice, type PlanCopy } from "../plans";

type Props = {
  plan: PlanCopy;
  interval: BillingInterval;
  current: boolean;
  highlight?: boolean;
  action?: React.ReactNode;
};

export function PlanCard({ plan, interval, current, highlight, action }: Props) {
  const amount = plan.price[interval];

  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-lg surface-1 p-6",
        highlight && "border-brand/40",
      )}
    >
      {current && (
        <span className="absolute top-4 right-4 rounded-sm border border-brand/30 px-1.5 py-0.5 font-mono text-[10px] text-brand">
          CURRENT
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-2xl">{plan.name}</h3>
        <p className="text-sm text-fg-1">{plan.tagline}</p>
      </div>

      <p className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl text-fg-0 tabular-nums">{formatPrice(amount)}</span>
        {amount > 0 && <span className="text-sm text-fg-2">/ {interval}</span>}
      </p>

      <StaggerContainer className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <StaggerItem key={f} className="flex items-start gap-2 text-sm text-fg-1">
            <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
            {f}
          </StaggerItem>
        ))}
      </StaggerContainer>

      {action && <div className="mt-auto pt-2">{action}</div>}
    </div>
  );
}
