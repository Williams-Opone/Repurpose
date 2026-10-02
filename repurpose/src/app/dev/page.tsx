"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SourceInput } from "@/features/ingest/components/source-input";
import type { Source } from "@/features/ingest/types";
import { PlatformIcon } from "@/components/icons/platforms";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AnimatedCheck } from "@/components/motion/animated-check";
import { FadeIn } from "@/components/motion/fade-in";
import { Magnetic } from "@/components/motion/magnetic-button";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Shimmer, ShimmerLines } from "@/components/motion/shimmer";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLATFORMS } from "@/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs tracking-wider text-fg-2 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function DevPage() {
  const [count, setCount] = useState(3);
  const [checked, setChecked] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [source, setSource] = useState<Source | null>(null);
  return (
    <div className="flex">
      <Sidebar footer={<div className="px-2 text-xs text-fg-2">user menu → phase 3</div>} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title="Kitchen sink" actions={<Button size="sm">Action</Button>} />

        <main className="flex flex-col gap-12 p-8">
          <Section title="Typography">
            <h1 className="font-serif text-5xl">Sounds like you, not a robot.</h1>
            <p className="max-w-[65ch] text-fg-1">
              Body text at 16px, line-height 1.6, zinc-tinted secondary. The display face is
              reserved for moments that deserve it.
            </p>
            <code className="font-mono text-sm text-fg-2">142 / 280</code>
          </Section>

          <Section title="Surfaces">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg surface-1 p-5 text-sm">surface-1</div>
              <div className="rounded-lg surface-2 p-5 text-sm">surface-2</div>
              <div className="rounded-lg float p-5 text-sm">float</div>
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Generate</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Section>

          <Section title="Card + inputs + badges">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Brand voice</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Input placeholder="Paste a past post…" />
                <div className="flex gap-2">
                  <Badge>direct</Badge>
                  <Badge variant="secondary">warm</Badge>
                  <Badge variant="outline">slightly irreverent</Badge>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section title="Motion: FadeIn / Stagger (click to replay)">
            <Button variant="secondary" size="sm" onClick={() => setListKey((k) => k + 1)}>
              Replay
            </Button>
            <StaggerContainer key={listKey} className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <StaggerItem key={i} className="rounded-md surface-1 p-4 text-sm">
                  Item {i + 1}
                </StaggerItem>
              ))}
            </StaggerContainer>
            <FadeIn key={`f-${listKey}`} delay={0.3} className="text-sm text-fg-1">
              This line fades up 300ms after the grid.
            </FadeIn>
          </Section>

          <Section title="Motion: NumberTicker / AnimatedCheck / Magnetic">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={() => setCount((c) => Math.max(0, c - 1))}
                >
                  −
                </Button>
                <span className="font-mono text-2xl">
                  <NumberTicker value={count} /> <span className="text-fg-2">/ 5</span>
                </span>
                <Button size="icon-sm" variant="secondary" onClick={() => setCount((c) => c + 1)}>
                  +
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setChecked((c) => !c)}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-line-strong"
              >
                <span className="grid size-5 place-items-center rounded-sm border border-line-strong text-brand">
                  <AnimatedCheck checked={checked} size={14} />
                </span>
                Toggle
              </button>

              <Magnetic>
                <Button size="lg">Magnetic (marketing)</Button>
              </Magnetic>
            </div>
          </Section>

          <Section title="Skeletons">
            <div className="grid max-w-xl grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 rounded-lg surface-1 p-4">
                <div className="flex items-center gap-3">
                  <Shimmer className="size-8 rounded-full" />
                  <Shimmer className="h-3 w-24" />
                </div>
                <ShimmerLines lines={3} />
              </div>
              <ShimmerLines lines={5} />
            </div>
          </Section>

          <Section title="Overlays">
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => toast.success("3 outputs ready")}>
                Toast
              </Button>
              <Dialog>
                <DialogTrigger render={<Button variant="secondary" />}>Dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                      Delete this generation?
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-fg-1">
                    We&apos;ll use undo toasts in the real app, not this.
                  </p>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger render={<Button variant="secondary" />}>Tooltip</TooltipTrigger>
                <TooltipContent>Copies as plain text</TooltipContent>
              </Tooltip>
            </div>
          </Section>

          <Section title="Platform icons">
            <div className="flex gap-4 text-fg-1">
              {PLATFORMS.map((p) => (
                <PlatformIcon key={p} platform={p} size={20} />
              ))}
            </div>
          </Section>
          <Section title="Ingest: paste text, drop a .txt, or paste a YouTube / article link">
            <div className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <SourceInput value={source} onChange={setSource} />
              <pre className="overflow-auto rounded-md surface-2 p-4 font-mono text-xs text-fg-1">
                {source
                  ? JSON.stringify(
                      {
                        ...source,
                        text: `${source.text.slice(0, 160)}… (${source.text.length} chars)`,
                      },
                      null,
                      2,
                    )
                  : "null"}
              </pre>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
