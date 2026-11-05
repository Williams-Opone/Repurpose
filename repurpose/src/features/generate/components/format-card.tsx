"use client";

import { motion } from "motion/react";

import { PlatformIcon } from "@/components/icons/platforms";
import { AnimatedCheck } from "@/components/motion/animated-check";
import { hoverLift, tapPress } from "@/components/motion/motion.config";
import { cn } from "@/lib/utils";
import { FORMAT_META, type Format } from "@/types";

export function FormatCard({
  format,
  checked,
  onToggle,
  disabled,
}: {
  format: Format;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const meta = FORMAT_META[format];
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      whileHover={disabled ? undefined : hoverLift}
      whileTap={disabled ? undefined : tapPress}
      className={cn(
        "flex items-start gap-3 rounded-md surface-1 p-3 text-left transition-colors disabled:opacity-50",
        checked ? "border-brand/50 bg-brand/5" : "hover:border-line-strong",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-sm border transition-colors",
          checked
            ? "border-brand bg-brand text-brand-foreground"
            : "border-line-strong text-transparent",
        )}
      >
        <AnimatedCheck checked={checked} size={12} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <PlatformIcon platform={meta.platform} size={13} className="text-fg-1" />
          {meta.label}
        </span>
        <span className="text-xs text-fg-2">{meta.description}</span>
      </span>
    </motion.button>
  );
}
