"use client";

import { motion } from "motion/react";

import { durations, easings } from "./motion.config";

type AnimatedCheckProps = {
  checked: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function AnimatedCheck({
  checked,
  size = 16,
  strokeWidth = 2.5,
  className,
}: AnimatedCheckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{
          pathLength: { duration: durations.base, ease: easings.out },
          opacity: { duration: durations.fast },
        }}
      />
    </svg>
  );
}
