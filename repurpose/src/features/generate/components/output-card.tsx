"use client";

import { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { PlatformIcon } from "@/components/icons/platforms";
import { AnimatedCheck } from "@/components/motion/animated-check";
import { FadeIn } from "@/components/motion/fade-in";
import { durations, easings } from "@/components/motion/motion.config";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import {
  AUTOSAVE_DEBOUNCE_MS,
  LINKEDIN_MAX_CHARS,
  YOUTUBE_DESCRIPTION_MAX_CHARS,
} from "@/lib/constants";
import { assertNever } from "@/lib/utils";
import { FORMAT_META, type Format, type OutputContent } from "@/types";

import { resetOutput, saveEdit } from "../actions";
import { FORMAT_REGISTRY, outputToPlainText } from "../prompts/formats";
import type { FormatState } from "../state";
import { CopyButton } from "./copy-button";
import { OutputSkeleton } from "./output-skeleton";
import { RegeneratePopover } from "./regenerate-popover";
import { CaptionRenderer } from "./renderers/caption-renderer";
import { NewsletterRenderer } from "./renderers/newsletter-renderer";
import { PostRenderer } from "./renderers/post-renderer";
import { ThreadRenderer } from "./renderers/thread-renderer";

type Partialish = Record<string, unknown> | undefined;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? (v as (string | undefined)[]) : undefined);

function StreamingBody({ format, partial }: { format: Format; partial: Partialish }) {
  const kind = FORMAT_REGISTRY[format].kind;
  const p = partial ?? {};
  const hasAny = Object.keys(p).length > 0;
  if (!hasAny) return <OutputSkeleton kind={kind} />;
  switch (kind) {
    case "thread":
      return <ThreadRenderer tweets={arr(p.tweets)} streaming />;
    case "post":
      return <PostRenderer body={str(p.body)} max={LINKEDIN_MAX_CHARS} streaming />;
    case "description":
      return <PostRenderer body={str(p.body)} max={YOUTUBE_DESCRIPTION_MAX_CHARS} streaming />;
    case "newsletter":
      return <NewsletterRenderer subject={str(p.subject)} body={str(p.body)} streaming />;
    case "caption":
      return <CaptionRenderer body={str(p.body)} hashtags={arr(p.hashtags)} streaming />;
    default:
      return assertNever(kind);
  }
}

function Editable({
  content,
  onChange,
}: {
  content: OutputContent;
  onChange: (c: OutputContent) => void;
}) {
  switch (content.kind) {
    case "thread":
      return (
        <ThreadRenderer
          tweets={content.tweets}
          onChange={(tweets) => onChange({ kind: "thread", tweets })}
        />
      );
    case "post":
      return (
        <PostRenderer
          body={content.body}
          max={LINKEDIN_MAX_CHARS}
          hint="First line shows before …see more"
          onChange={(body) => onChange({ kind: "post", body })}
        />
      );
    case "description":
      return (
        <PostRenderer
          body={content.body}
          max={YOUTUBE_DESCRIPTION_MAX_CHARS}
          onChange={(body) => onChange({ kind: "description", body })}
        />
      );
    case "newsletter":
      return (
        <NewsletterRenderer
          subject={content.subject}
          body={content.body}
          onChange={(v) => onChange({ kind: "newsletter", ...v })}
        />
      );
    case "caption":
      return (
        <CaptionRenderer
          body={content.body}
          hashtags={content.hashtags}
          onChange={(v) => onChange({ kind: "caption", ...v })}
        />
      );
    default:
      return assertNever(content);
  }
}

type DoneProps = {
  output: Extract<FormatState, { status: "done" }>;
  initialEdited: OutputContent | undefined;
  onRegenerate: (instruction?: string) => void;
  busy: boolean;
};

function DoneBody({ output, initialEdited, onRegenerate, busy }: DoneProps) {
  const [draft, setDraft] = useState<OutputContent>(initialEdited ?? output.content);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const edited = JSON.stringify(draft) !== JSON.stringify(output.content);

  const persist = useDebouncedCallback(async (content: OutputContent) => {
    setSave("saving");
    const res = await saveEdit({ outputId: output.outputId, content });
    setSave(res.ok ? "saved" : "error");
    if (!res.ok) toast.error(res.message);
  }, AUTOSAVE_DEBOUNCE_MS);

  function change(content: OutputContent) {
    setDraft(content);
    persist(content);
  }

  async function reset() {
    setDraft(output.content);
    setSave("idle");
    const res = await resetOutput({ outputId: output.outputId });
    if (!res.ok) toast.error(res.message);
  }

  return (
    <>
      <Editable content={draft} onChange={change} />
      <footer className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="font-mono text-[11px] text-fg-2" aria-live="polite">
          {save === "saving"
            ? "Saving…"
            : save === "saved"
              ? "Saved"
              : save === "error"
                ? "Not saved"
                : edited
                  ? "Edited"
                  : ""}
        </span>
        <div className="flex items-center gap-1">
          {edited && (
            <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
              <RotateCcw /> Reset
            </Button>
          )}
          <RegeneratePopover onRegenerate={onRegenerate} disabled={busy} />
          <CopyButton text={outputToPlainText(draft)} />
        </div>
      </footer>
    </>
  );
}

export type OutputCardProps = {
  format: Format;
  state: FormatState;
  initialEdited: OutputContent | undefined;
  onRegenerate: (instruction?: string) => void;
  busy: boolean;
};

export function OutputCard({ format, state, initialEdited, onRegenerate, busy }: OutputCardProps) {
  const meta = FORMAT_META[format];
  const done = state.status === "done";

  return (
    <article className="relative flex flex-col rounded-lg surface-1 p-5">
      {/* one-shot brand pulse when a format lands — opacity only */}
      <AnimatePresence>
        {done && (
          <motion.span
            key={`pulse-${state.revision}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-brand/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: durations.slow * 2, ease: easings.inOut }}
          />
        )}
      </AnimatePresence>

      <header className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <PlatformIcon platform={meta.platform} size={14} className="text-fg-1" />
          {meta.label}
        </span>
        <span
          className="flex items-center gap-1.5 font-mono text-[11px] text-fg-2"
          aria-live="polite"
        >
          {state.status === "streaming" && (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-brand" /> writing…
            </>
          )}
          {state.status === "done" && (
            <>
              <span className="text-brand">
                <AnimatedCheck checked size={12} />
              </span>{" "}
              ready
            </>
          )}
          {state.status === "error" && <AlertCircle className="size-3.5 text-danger" />}
        </span>
      </header>

      {state.status === "streaming" && (
        <StreamingBody format={format} partial={state.partial as Partialish} />
      )}
      {state.status === "idle" && <OutputSkeleton kind={FORMAT_REGISTRY[format].kind} />}
      {state.status === "error" && (
        <FadeIn className="flex flex-col items-start gap-3">
          <p className="text-sm text-danger">{state.message}</p>
          <RegeneratePopover onRegenerate={onRegenerate} disabled={busy} />
        </FadeIn>
      )}
      {done && (
        <FadeIn key={state.revision}>
          <DoneBody
            output={state}
            initialEdited={initialEdited}
            onRegenerate={onRegenerate}
            busy={busy}
          />
        </FadeIn>
      )}
    </article>
  );
}
