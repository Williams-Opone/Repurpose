"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MAX_VOICE_SAMPLES } from "@/lib/constants";
import type { ActionResult } from "@/lib/errors";

import { addSample, deleteVoice, removeSample, setDefaultVoice } from "../actions";
import type { VoiceWithSamples } from "../queries";
import { VoiceProfileSchema } from "../schema";
import { AnalyzingState } from "./analyzing-state";
import { SampleCard } from "./sample-card";
import { SampleInput } from "./sample-input";
import { VoiceProfileCard } from "./voice-profile-card";

export function VoiceDetail({ voice }: { voice: VoiceWithSamples }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { object, submit, isLoading } = useObject({
    api: "/api/voice/analyze",
    schema: VoiceProfileSchema,
    onFinish: ({ object }) => {
      if (object) {
        toast.success("Voice profile updated");
        router.refresh();
      }
    },
    onError: () => toast.error("Re-analysis failed. Try again."),
  });

  /** Run an action, toast on failure, refresh on success. */
  function run<T>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      onOk?.(res.data);
      router.refresh();
    });
  }

  const busy = pending || isLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex flex-col gap-4">
        {isLoading ? (
          <AnalyzingState partial={object} />
        ) : voice.profile ? (
          <VoiceProfileCard profile={voice.profile} />
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg surface-1 p-6">
            <p className="font-serif text-2xl">Not analyzed yet.</p>
            <p className="text-sm text-fg-1">
              Run the analysis to build this voice&apos;s profile.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => submit({ voiceId: voice.id })} disabled={busy}>
            <RefreshCw className={isLoading ? "animate-spin" : undefined} />
            {voice.profile ? "Re-analyze" : "Analyze"}
          </Button>
          {!voice.isDefault && (
            <Button
              variant="ghost"
              onClick={() => run(() => setDefaultVoice({ voiceId: voice.id }))}
              disabled={busy}
            >
              <Star />
              Make default
            </Button>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">
          Samples · {voice.samples.length} / {MAX_VOICE_SAMPLES}
        </h2>

        <div className="flex flex-col gap-3">
          {voice.samples.map((s) => (
            <SampleCard
              key={s.id}
              platform={s.platform}
              content={s.content}
              disabled={busy}
              onRemove={() => run(() => removeSample({ voiceId: voice.id, sampleId: s.id }))}
            />
          ))}
        </div>

        {voice.samples.length < MAX_VOICE_SAMPLES && (
          <SampleInput
            compact
            disabled={busy}
            onAdd={(sample) =>
              run(
                () => addSample({ voiceId: voice.id, sample }),
                () => toast.success("Sample added — re-analyze to update the profile"),
              )
            }
          />
        )}

        <div className="mt-4 border-t border-line pt-4">
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Delete "${voice.name}"? This can't be undone.`)) return;
              run(
                () => deleteVoice({ voiceId: voice.id }),
                () => router.push("/voice"),
              );
            }}
          >
            <Trash2 />
            Delete voice
          </Button>
        </div>
      </aside>
    </div>
  );
}
