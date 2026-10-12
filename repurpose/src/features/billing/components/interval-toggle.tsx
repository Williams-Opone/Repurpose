"use client";

import { motion } from "motion/react";

import { springs } from "@/components/motion/motion.config";
import { cn } from "@/lib/utils";
import { BILLING_INTERVALS, type BillingInterval } from "@/types";

import { YEARLY_FREE_MONTHS } from "../plans";

export function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (i: BillingInterval) => void;
}) {
  return (
    <div
      className="flex w-fit gap-1 rounded-md border border-line p-1"
      role="group"
      aria-label="Billing interval"
    >
      {BILLING_INTERVALS.map((i) => (
        <button
          key={i}
          type="button"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
          className={cn(
            "relative rounded-sm px-3 py-1 text-sm transition-colors",
            value === i ? "text-fg-0" : "text-fg-1 hover:text-fg-0",
          )}
        >
          {value === i && (
            <motion.span
              layoutId="interval-pill"
              transition={springs.ui}
              className="absolute inset-0 rounded-sm bg-bg-3"
            />
          )}
          <span className="relative">
            {i === "month" ? "Monthly" : `Yearly · ${YEARLY_FREE_MONTHS} months free`}
          </span>
        </button>
      ))}
    </div>
  );
}
