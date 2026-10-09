"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import type { Generation } from "@/db/schema";
import type { Entitlements } from "@/features/billing/quota";
import { SourceInput } from "@/features/ingest/components/source-input";
import { parseYouTubeUrl, youtubeThumbnail } from "@/features/ingest/detect";
import { buildSource } from "@/features/ingest/normalize";
import type { Source } from "@/features/ingest/types";
import { VoiceSelector, type VoiceOption } from "@/features/voice/components/voice-selector";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { SAMPLE_SOURCE_TEXT } from "@/lib/sample-content";
import type { Format, OutputContent } from "@/types";

import { useGenerationStream } from "../hooks/use-generation-stream";
import { initialStateFrom, type InitialOutput } from "../state";
import { FormatPicker } from "./format-picker";
import { GenerateButton } from "./generate-button";
import { OutputPanel } from "./output-panel";
import { UsagePill } from "./usage-pill";

type SourceFields = Pick<Generation, "sourceType" | "sourceTitle" | "sourceUrl" | "sourceContent">;

/** A persisted generation reopened at /workspace/[id]. */
export type WorkspaceInitial = {
  generation: SourceFields & Pick<Generation, "id" | "formats" | "voiceId">;
  outputs: InitialOutput[];
  edited: Record<string, OutputContent>;
};

/** A past source reused via /workspace?from=<id> — source only, no outputs. */
export type WorkspacePrefill =
  (SourceFields & { formats: Format[]; voiceId: string | null }) | null;

type Props = {
  voices: VoiceOption[];
  entitlements: Entitlements;
  initial: WorkspaceInitial | null;
  prefill?: WorkspacePrefill;
};

const DEFAULT_FORMATS: Format[] = ["twitter_thread", "linkedin_post", "newsletter_section"];

function sourceFromFields(g: SourceFields): Source {
  const videoId = g.sourceUrl ? parseYouTubeUrl(g.sourceUrl) : null;
  return buildSource({
    type: g.sourceType,
    text: g.sourceContent,
    title: g.sourceTitle,
    url: g.sourceUrl,
    thumbnailUrl: videoId ? youtubeThumbnail(videoId) : null,
  });
}

export function Workspace({ voices, entitlements, initial, prefill = null }: Props) {
  const router = useRouter();

  const [source, setSource] = useState<Source | null>(
    initial ? sourceFromFields(initial.generation) : prefill ? sourceFromFields(prefill) : null,
  );
  const [selected, setSelected] = useState<Format[]>(
    initial?.generation.formats ?? prefill?.formats ?? DEFAULT_FORMATS,
  );
  const [order, setOrder] = useState<Format[]>(initial?.generation.formats ?? []);
  const [voiceId, setVoiceId] = useState<string | null>(
    initial?.generation.voiceId ??
      prefill?.voiceId ??
      voices.find((v) => v.isDefault)?.id ??
      voices[0]?.id ??
      null,
  );
  const [sourceKey, setSourceKey] = useState(0);

  // Tracked locally so finishing a generation never triggers a server navigation.
  const [remaining, setRemaining] = useState(entitlements.remaining);

  const { state, generate, regenerate, cancel, reset } = useGenerationStream(
    initialStateFrom(
      initial
        ? {
            generationId: initial.generation.id,
            formats: initial.generation.formats,
            outputs: initial.outputs,
          }
        : null,
    ),
  );

  // Announce completion once per run. The URL never changes mid-flight — the App Router
  // treats a pathname replaceState as a navigation and would remount this component.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !state.running && state.generationId) {
      const done = Object.values(state.formats).filter((f) => f.status === "done").length;
      if (done > 0) toast.success(`${done} output${done === 1 ? "" : "s"} ready`);
    }
    wasRunning.current = state.running;
  }, [state.running, state.generationId, state.formats]);

  const quotaExhausted = remaining === 0 || state.requestError?.code === "QUOTA_EXCEEDED";
  const canGenerate = Boolean(source) && selected.length > 0 && !state.running && !quotaExhausted;
  const doneCount = order.filter(
    (f) => state.formats[f]?.status === "done" || state.formats[f]?.status === "error",
  ).length;

  async function onGenerate() {
    if (!canGenerate || !source) return;
    setOrder(selected);
    const err = await generate({ source, formats: selected, voiceId });
    if (err) {
      if (err.code === "QUOTA_EXCEEDED") setRemaining(0);
      toast.error(err.message);
      return;
    }
    // Optimistic: the server reserved one. If every format failed it refunds, and the
    // next page load corrects the count.
    setRemaining((r) => (r === null ? null : Math.max(0, r - 1)));
  }

  async function onRegenerate(format: Format, instruction?: string) {
    const err = await regenerate(format, instruction);
    if (err) toast.error(err.message);
  }

  function startNew() {
    cancel();
    reset();
    setSource(null);
    setOrder([]);
    setSourceKey((k) => k + 1);
  }

  function useSample() {
    setSource(buildSource({ type: "paste", text: SAMPLE_SOURCE_TEXT }));
    setSourceKey((k) => k + 1);
  }

  useHotkeys([{ key: "Enter", mod: true, allowInInputs: true, handler: () => void onGenerate() }]);

  return (
    <>
      <Topbar
        title="Workspace"
        actions={
          <>
            {voices.length > 0 ? (
              <VoiceSelector voices={voices} value={voiceId} onChange={setVoiceId} />
            ) : (
              <Button size="sm" variant="secondary" onClick={() => router.push("/voice/new")}>
                Set up a voice
              </Button>
            )}
            <UsagePill remaining={remaining} limit={entitlements.limit} />
            {state.generationId && !state.running && (
              <Link
                href={`/workspace/${state.generationId}`}
                className="flex h-8 items-center gap-1 rounded-sm px-2 font-mono text-xs text-fg-2 transition-colors hover:text-fg-0"
              >
                Permalink <ArrowUpRight className="size-3" />
              </Link>
            )}
            {state.generationId && (
              <Button size="sm" variant="ghost" onClick={startNew}>
                <Plus /> New
              </Button>
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(380px,42%)_1fr] lg:overflow-hidden">
        <section className="flex flex-col border-line lg:min-h-0 lg:border-r">
          <div className="flex flex-1 flex-col gap-6 p-6 lg:min-h-0 lg:overflow-y-auto">
            <SourceInput
              key={sourceKey}
              value={source}
              onChange={setSource}
              disabled={state.running}
            />
            <FormatPicker selected={selected} onChange={setSelected} disabled={state.running} />
          </div>
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-bg-0 px-6 py-4">
            <span className="font-mono text-xs text-fg-2">
              {source
                ? `${source.wordCount.toLocaleString()} words in`
                : "Nothing to work with yet"}
            </span>
            <GenerateButton
              count={selected.length || 1}
              doneCount={doneCount}
              running={state.running}
              disabled={!canGenerate}
              quotaExhausted={quotaExhausted}
              onGenerate={() => void onGenerate()}
              onCancel={cancel}
            />
          </footer>
        </section>

        <section className="min-h-0 bg-bg-0 lg:overflow-y-auto">
          <OutputPanel
            order={order}
            state={state}
            edited={initial?.edited ?? {}}
            onRegenerate={onRegenerate}
            onTrySample={useSample}
          />
        </section>
      </div>
    </>
  );
}
