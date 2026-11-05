"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

import { springParams } from "./motion.config";

type NumberTickerProps = {
  value: number;
  className?: string;
  format?: (n: number) => string;
};

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

export function NumberTicker({ value, className, format = defaultFormat }: NumberTickerProps) {
  const reduceMotion = useReducedMotion();
  const raw = useMotionValue(value);
  const spring = useSpring(raw, springParams.soft);
  const display = useTransform(spring, (v) => format(v));

  useEffect(() => {
    if (reduceMotion) spring.jump(value);
    else raw.set(value);
  }, [value, reduceMotion, raw, spring]);

  return <motion.span className={cn("tabular-nums", className)}>{display}</motion.span>;
}
