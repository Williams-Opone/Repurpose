"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { fadeUp, staggerContainer } from "./motion.config";

type ContainerProps = Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> & {
  /** Delay before the first child starts, in seconds. */
  delay?: number;
  inView?: boolean;
};

export function StaggerContainer({ delay = 0, inView = false, ...props }: ContainerProps) {
  const trigger = inView
    ? { whileInView: "visible", viewport: { once: true, margin: "-10% 0px" } }
    : { animate: "visible" };

  return (
    <motion.div
      variants={staggerContainer(delay)}
      initial="hidden"
      exit="exit"
      {...trigger}
      {...props}
    />
  );
}

// Children inherit the parent's variant state — never set initial/animate here.
export function StaggerItem(props: Omit<HTMLMotionProps<"div">, "variants">) {
  return <motion.div variants={fadeUp} {...props} />;
}
