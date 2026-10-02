"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion/fade-in";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_VOICE_SAMPLES, MIN_VOICE_SAMPLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VoiceProfile } from "@/types";

import { createVoice } from "../actions";
import { VoiceProfileSchema, type SampleInput as SampleInputValue } from "../schema";
import { AnalyzingState } from "./analyzing-state";
import { SampleCard } from "./sample-card";
import { SampleInput } from "./sample-input";
import { VoiceProfileCard } from "./voice-profile-card";

type Step = "samples" | "analyzing" | "done";
type LocalSample = SampleInputValue & { id: string };

const STEPS: Array<{ key: Step; label: string }> = [
  { key: "samples", label: "Samples" },
  { key: "analyzing", label: "Analyzing" },
  { key: "done", label: "Your voice" },
];

function StepIndicator({ step }: { step: Step }) {
  const idx = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-3 font-mono text-xs">
      {STEPS.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "todo";
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-2",
                state === "active" ? "text-fg-0" : state === "done" ? "text-fg-1" : "text-fg-2",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border text-[10px]",
                  state === "active" && "border-brand text-brand",
                  state === "done" && "border-brand bg-brand text-brand-foreground",
                  state === "todo" && "border-line",
                )}
              >
                {state === "done" ? <Check className="size-3" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}

export function VoiceSetupFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("samples");
  const [name, setName] = useState("My voice");
  const [samples, setSamples] = useState<LocalSample[]>([]);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [pending, startTransition] = useTransition();

  const { object, submit, error, isLoading } = useObject({
    api: "/api/voice/analyze",
    schema: VoiceProfileSchema,
    onFinish: ({ object }) => {
      if (!object) {
        toast.error("The analysis came back malformed. Try again.");
        return;
      }
      setProfile(object);
      setStep("done");
      router.refresh();
    },
    onError: () => toast.error("Analysis failed. Your samples are saved — try again."),
  });

  const canAnalyze = samples.length >= MIN_VOICE_SAMPLES && name.trim().length > 0 && !pending;

  function startAnalysis() {
    startTransition(async () => {
      const res = await createVoice({
        name,
        samples: samples.map(({ platform, content }) => ({ platform, content })),
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setVoiceId(res.data.voiceId);
      setStep("analyzing");
      submit({ voiceId: res.data.voiceId });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <StepIndicator step={step} />

      <AnimatePresence mode="wait">
        {step === "samples" && (
          <FadeIn key="samples" className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-4xl">Show us how you write.</h2>
              <p className="mt-2 max-w-prose text-fg-1">
                Paste {MIN_VOICE_SAMPLES}–{MAX_VOICE_SAMPLES} things you&apos;ve actually published.
                Different platforms help — a tweet and a LinkedIn post teach us more than two
                tweets.
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">
                Voice name
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="max-w-xs"
              />
            </label>

            {samples.length < MAX_VOICE_SAMPLES && (
              <SampleInput
                onAdd={(s) => setSamples((xs) => [...xs, { ...s, id: crypto.randomUUID() }])}
              />
            )}

            {samples.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence initial={false}>
                  {samples.map((s) => (
                    <FadeIn key={s.id} layout>
                      <SampleCard
                        platform={s.platform}
                        content={s.content}
                        onRemove={() => setSamples((xs) => xs.filter((x) => x.id !== s.id))}
                      />
                    </FadeIn>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-line pt-5">
              <span className="font-mono text-xs text-fg-2">
                {samples.length} of {MIN_VOICE_SAMPLES} minimum
              </span>
              <Button size="lg" onClick={startAnalysis} disabled={!canAnalyze}>
                <Sparkles />
                {pending ? "Saving…" : "Analyze my voice"}
              </Button>
            </div>
          </FadeIn>
        )}

        {step === "analyzing" && (
          <FadeIn key="analyzing" className="flex flex-col gap-4">
            <AnalyzingState partial={object} />
            {error && !isLoading && voiceId && (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => submit({ voiceId })}>
                  Try again
                </Button>
              </div>
            )}
          </FadeIn>
        )}

        {step === "done" && profile && (
          <FadeIn key="done" className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-4xl">This is your voice.</h2>
              <p className="mt-2 text-fg-1">
                Everything we generate will be shaped by this profile. You can refine it any time.
              </p>
            </div>
            <VoiceProfileCard profile={profile} />
            <div className="flex items-center justify-end gap-3">
              {voiceId && (
                <Link
                  href={`/voice/${voiceId}`}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Review samples
                </Link>
              )}
              <Link href="/workspace" className={buttonVariants({ size: "lg" })}>
                Go to workspace
                <ArrowRight />
              </Link>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  );
}
