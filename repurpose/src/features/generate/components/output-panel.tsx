"use client";

import { Sparkles } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import type { Format, OutputContent } from "@/types";

import type { GenerationState } from "../state";
import { OutputCard } from "./output-card";

type Props = {
  order: Format[];
  state: GenerationState;
  edited: Record<string, OutputContent>;
  onRegenerate: (format: Format, instruction?: string) => void;
  onTrySample: () => void;
};

export function OutputPanel({ order, state, edited, onRegenerate, onTrySample }: Props) {
  const visible = order.filter((f) => state.formats[f] && state.formats[f]?.status !== "idle");

  if (visible.length === 0) {
    return (
      <FadeIn className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-lg bg-bg-2 text-fg-1">
          <Sparkles className="size-5" />
        </span>
        <h2 className="font-serif text-3xl">Your outputs land here.</h2>
        <p className="max-w-xs text-sm text-fg-1">
          Paste something on the left, pick your formats, and press ⌘↵.
        </p>
        <Button variant="secondary" size="sm" onClick={onTrySample}>
          Try with a sample post
        </Button>
      </FadeIn>
    );
  }

  return (
    <StaggerContainer className="grid gap-4 p-6 xl:grid-cols-2">
      <AnimatePresence initial={false}>
        {visible.map((f) => {
          const fs = state.formats[f]!;
          return (
            <StaggerItem key={f} layout>
              <OutputCard
                format={f}
                state={fs}
                initialEdited={fs.status === "done" ? edited[fs.outputId] : undefined}
                onRegenerate={(i) => onRegenerate(f, i)}
                busy={state.running}
              />
            </StaggerItem>
          );
        })}
      </AnimatePresence>
    </StaggerContainer>
  );
}
