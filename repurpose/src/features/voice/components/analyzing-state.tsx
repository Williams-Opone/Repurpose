"use client";

import type { DeepPartial } from "ai";
import { AnimatePresence, motion } from "motion/react";

import { FadeIn } from "@/components/motion/fade-in";
import { springs } from "@/components/motion/motion.config";
import { Shimmer } from "@/components/motion/shimmer";
import type { VoiceProfile } from "@/types";

import { POV_LABELS, SENTENCE_LABELS } from "../schema";
import { Chips } from "./voice-profile-card";

type PartialProfile = DeepPartial<VoiceProfile> | undefined;
type P = NonNullable<PartialProfile>;

const strs = (xs: ReadonlyArray<string | undefined> | undefined) =>
  (xs ?? []).filter((x): x is string => Boolean(x && x.trim()));

type Row = {
  key: string;
  label: string;
  ready: (p: P) => boolean;
  render: (p: P) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    key: "tone",
    label: "Tone",
    ready: (p) => strs(p.tone).length > 0,
    render: (p) => <Chips items={strs(p.tone)} />,
  },
  {
    key: "pov",
    label: "Point of view",
    ready: (p) => Boolean(p.pointOfView && p.pointOfView in POV_LABELS),
    render: (p) => (
      <span className="text-sm">{p.pointOfView ? POV_LABELS[p.pointOfView] : null}</span>
    ),
  },
  {
    key: "sentences",
    label: "Sentences",
    ready: (p) => Boolean(p.sentenceLength && p.sentenceLength in SENTENCE_LABELS),
    render: (p) => (
      <span className="text-sm">{p.sentenceLength ? SENTENCE_LABELS[p.sentenceLength] : null}</span>
    ),
  },
  {
    key: "habits",
    label: "Structural habits",
    ready: (p) => strs(p.structuralHabits).length > 0,
    render: (p) => (
      <ul className="flex flex-col gap-1 text-sm text-fg-1">
        {strs(p.structuralHabits).map((h, i) => (
          <li key={i}>• {h}</li>
        ))}
      </ul>
    ),
  },
  {
    key: "vocab",
    label: "Vocabulary",
    ready: (p) => strs(p.vocabulary?.favors).length > 0,
    render: (p) => <Chips items={strs(p.vocabulary?.favors)} />,
  },
  {
    key: "phrases",
    label: "Signature phrases",
    ready: (p) => p.signaturePhrases !== undefined,
    render: (p) =>
      strs(p.signaturePhrases).length ? (
        <Chips items={strs(p.signaturePhrases)} mono />
      ) : (
        <span className="text-sm text-fg-2">
          None detected — you don&apos;t lean on catchphrases.
        </span>
      ),
  },
  {
    key: "summary",
    label: "In short",
    ready: (p) => Boolean(p.summary),
    render: (p) => <p className="font-serif text-xl leading-snug text-balance">{p.summary}</p>,
  },
];

export function AnalyzingState({ partial }: { partial: PartialProfile }) {
  const p: P = partial ?? {};
  const readyCount = ROWS.filter((r) => r.ready(p)).length;
  const status =
    readyCount === 0
      ? "Reading your samples…"
      : readyCount < ROWS.length - 1
        ? "Mapping your style…"
        : "Writing your summary…";

  return (
    <div className="flex flex-col gap-6 rounded-lg surface-1 p-6">
      <div className="flex items-center gap-2.5" aria-live="polite">
        <span className="size-2 animate-pulse rounded-full bg-brand" />
        <span className="font-mono text-xs text-fg-1">{status}</span>
      </div>

      <div className="flex flex-col gap-5">
        {ROWS.map((row) => {
          const ready = row.ready(p);
          return (
            <motion.div
              key={row.key}
              layout
              transition={springs.ui}
              className="flex flex-col gap-2"
            >
              <span className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">
                {row.label}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                {ready ? (
                  <FadeIn key="content">{row.render(p)}</FadeIn>
                ) : (
                  <FadeIn key="skeleton" plain>
                    <Shimmer className={row.key === "summary" ? "h-14 w-full" : "h-6 w-2/3"} />
                  </FadeIn>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
