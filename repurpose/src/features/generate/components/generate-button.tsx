"use client";

import { Sparkles, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { springs } from "@/components/motion/motion.config";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Button } from "@/components/ui/button";

type Props = {
  count: number;
  doneCount: number;
  running: boolean;
  disabled: boolean;
  quotaExhausted: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  onUpgrade: () => void;
};

export function GenerateButton({
  count,
  doneCount,
  running,
  disabled,
  quotaExhausted,
  onGenerate,
  onCancel,
  onUpgrade,
}: Props) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {quotaExhausted ? (
        <motion.div key="upgrade" layoutId="generate-cta" transition={springs.ui}>
          <Button size="lg" onClick={onUpgrade}>
            <Zap /> Upgrade to continue
          </Button>
        </motion.div>
      ) : running ? (
        <motion.div
          key="progress"
          layoutId="generate-cta"
          transition={springs.ui}
          className="flex h-11 items-center gap-3 rounded-md float px-4"
          role="status"
        >
          <span className="size-2 animate-pulse rounded-full bg-brand" />
          <span className="font-mono text-sm tabular-nums">
            <NumberTicker value={doneCount} /> / {count} ready
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="ml-1 text-fg-2 hover:text-fg-0"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div key="idle" layoutId="generate-cta" transition={springs.ui}>
          <Button size="lg" onClick={onGenerate} disabled={disabled}>
            <Sparkles /> Generate {count} format{count === 1 ? "" : "s"}
            <kbd className="ml-1 rounded-sm bg-black/20 px-1.5 font-mono text-[10px]">⌘↵</kbd>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
