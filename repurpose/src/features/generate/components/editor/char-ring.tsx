"use client";

import { motion } from "motion/react";

import { springs } from "@/components/motion/motion.config";
import { cn } from "@/lib/utils";

export function CharRing({ count, max, size = 20 }: { count: number; max: number; size?: number }) {
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(count / max, 1);
  const over = count > max;
  const near = !over && count > max * 0.9;
  const tone = over ? "text-danger" : near ? "text-warning" : "text-fg-2";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums", tone)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-line"
          strokeWidth={2}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          className={over ? "stroke-danger" : near ? "stroke-warning" : "stroke-brand"}
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={springs.ui}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span aria-live="polite">{over ? `${count - max} over` : `${count} / ${max}`}</span>
    </span>
  );
}
