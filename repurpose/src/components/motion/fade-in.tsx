"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { fade, fadeUp } from "./motion.config";

type FadeInProps = Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate" | "custom"> & {
  /** Delay in seconds. */
  delay?: number;
  /** Trigger when scrolled into view (marketing) instead of on mount. */
  inView?: boolean;
  /** Opacity only, no translate. */
  plain?: boolean;
};

export function FadeIn({ delay = 0, inView = false, plain = false, ...props }: FadeInProps) {
  const trigger = inView
    ? { whileInView: "visible", viewport: { once: true, margin: "-10% 0px" } }
    : { animate: "visible" };

  return (
    <motion.div
      variants={plain ? fade : fadeUp}
      initial="hidden"
      exit="exit"
      custom={delay}
      {...trigger}
      {...props}
    />
  );
}
