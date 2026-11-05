"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

import { springParams } from "./motion.config";

type MagneticProps = {
  children: React.ReactNode;
  /** 0–1. How far the element follows the cursor. */
  strength?: number;
  className?: string;
};

export function Magnetic({ children, strength = 0.25, className }: MagneticProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springParams.soft);
  const sy = useSpring(y, springParams.soft);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
