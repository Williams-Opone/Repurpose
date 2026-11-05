"use client";

import { useSyncExternalStore } from "react";

import { formatRelativeTime } from "@/lib/utils";

/** Ticks every 30s so "now" doesn't go stale. One shared clock for every instance. */
const clock = {
  subscribe(onChange: () => void) {
    const id = setInterval(onChange, 30_000);
    return () => clearInterval(id);
  },
  getSnapshot: () => Math.floor(Date.now() / 30_000),
  getServerSnapshot: () => 0,
};

/**
 * Absolute date during SSR, relative text after hydration.
 * useSyncExternalStore gives the server a stable snapshot, so no mismatch and no
 * setState-in-effect cascade.
 */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const value = typeof date === "string" ? new Date(date) : date;

  const tick = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);

  const absolute = value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // tick === 0 only on the server snapshot and the very first hydration pass.
  const label = tick === 0 ? absolute : formatRelativeTime(value);

  return (
    <time dateTime={value.toISOString()} title={absolute} className={className}>
      {label}
    </time>
  );
}