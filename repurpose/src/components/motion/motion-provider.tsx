"use client";

import { MotionConfig } from "motion/react";

import { springs } from "./motion.config";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={springs.ui}>
      {children}
    </MotionConfig>
  );
}
