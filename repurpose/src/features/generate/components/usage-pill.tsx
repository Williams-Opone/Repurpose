"use client";

import { Zap } from "lucide-react";

import { NumberTicker } from "@/components/motion/number-ticker";
import { cn } from "@/lib/utils";

export function UsagePill({
  remaining,
  limit,
}: {
  remaining: number | null;
  limit: number | null;
}) {
  if (remaining === null || limit === null) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-sm border border-brand/30 px-2.5 font-mono text-xs text-brand">
        <Zap className="size-3" /> Unlimited
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 items-center gap-1 rounded-sm border border-line px-2.5 font-mono text-xs tabular-nums",
        remaining === 0 ? "text-danger" : remaining === 1 ? "text-warning" : "text-fg-1",
      )}
    >
      <NumberTicker value={remaining} /> / {limit} left
    </span>
  );
}
