import type { Transition, Variants } from "motion/react";

// Raw spring params — for useSpring(), which takes options without `type`.
export const springParams = {
  ui: { stiffness: 300, damping: 30 },
  soft: { stiffness: 200, damping: 26 },
  page: { stiffness: 260, damping: 32 },
  snappy: { stiffness: 500, damping: 36 },
} as const;

// Full transitions — for `transition` props and variants.
export const springs = {
  ui: { type: "spring", ...springParams.ui },
  soft: { type: "spring", ...springParams.soft },
  page: { type: "spring", ...springParams.page },
  snappy: { type: "spring", ...springParams.snappy },
} as const satisfies Record<keyof typeof springParams, Transition>;

export const durations = { fast: 0.15, base: 0.25, slow: 0.45 } as const;

export const easings = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export const stagger = { item: 0.04, section: 0.1 } as const;

export const distance = { enter: 8, exit: 4, lift: -2 } as const;

/* ---------- Variants (consumed by primitives, never inlined elsewhere) ---------- */

// `custom` = optional delay in seconds.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: distance.enter },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...springs.ui, delay },
  }),
  exit: {
    opacity: 0,
    y: distance.exit,
    transition: { duration: durations.fast, ease: easings.out },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: durations.base, ease: easings.out, delay },
  }),
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springs.ui },
  exit: { opacity: 0, scale: 0.98, transition: { duration: durations.fast } },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: distance.enter },
  visible: { opacity: 1, y: 0, transition: springs.page },
};

export const staggerContainer = (delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger.item, delayChildren } },
  exit: { transition: { staggerChildren: stagger.item / 2, staggerDirection: -1 } },
});

/* ---------- Gesture presets ---------- */

export const hoverLift = { y: distance.lift, transition: springs.ui } as const;
export const tapPress = { scale: 0.98 } as const;
