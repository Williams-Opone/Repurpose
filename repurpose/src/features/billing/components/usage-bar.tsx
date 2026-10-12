"use client";

import { motion } from "motion/react";

import { springs } from "@/components/motion/motion.config";
import { NumberTicker } from "@/components/motion/number-ticker";
import { cn } from "@/lib/utils";

import type { Entitlements } from "../quota";

export function UsageBar({ entitlements }: { entitlements: Entitlements }) {
  const { used, limit, unlimited, remaining } = entitlements;
  const pct = unlimited || !limit ? 0 : Math.min(used / limit, 1);
  const tone = pct >= 1 ? "bg-danger" : pct >= 0.8 ? "bg-warning" : "bg-brand";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">This month</span>
        <span className="font-mono text-sm text-fg-1 tabular-nums">
          <NumberTicker value={used} className="text-fg-0" />
          {unlimited ? " generations" : ` / ${limit}`}
        </span>
      </div>

      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-3">
          <motion.div
            className={cn("h-full w-full rounded-full", tone)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: pct }}
            style={{ transformOrigin: "left" }}
            transition={springs.soft}
          />
        </div>
      )}

      <p className="text-xs text-fg-2">
        {unlimited
          ? "Unlimited on Pro."
          : remaining === 0
            ? "You're out until the 1st — or upgrade for unlimited."
            : `${remaining} left, resets on the 1st.`}
      </p>
    </div>
  );
}
