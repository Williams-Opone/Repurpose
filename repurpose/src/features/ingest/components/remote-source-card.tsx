"use client";

import Image from "next/image";
import { Globe, RotateCw, X } from "lucide-react";

import { YouTubeIcon } from "@/components/icons/platforms";
import { AnimatedCheck } from "@/components/motion/animated-check";
import { Shimmer } from "@/components/motion/shimmer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RemoteCardProps = {
  kind: "youtube" | "url";
  status: "loading" | "ready" | "error";
  url: string;
  title?: string | null;
  author?: string | null;
  thumbnailUrl?: string | null;
  wordCount?: number;
  truncated?: boolean;
  message?: string;
  onRetry?: () => void;
  onClear: () => void;
  disabled?: boolean;
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function RemoteSourceCard(p: RemoteCardProps) {
  const label = p.kind === "youtube" ? "YouTube" : hostname(p.url);
  const loadingText = p.kind === "youtube" ? "Fetching transcript…" : "Reading the article…";

  return (
    <div className="flex items-start gap-4 p-4">
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-bg-2">
        {p.thumbnailUrl ? (
          <Image src={p.thumbnailUrl} alt="" fill sizes="128px" className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-fg-2">
            <Globe className="size-5" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-fg-2 uppercase">
          {p.kind === "youtube" ? <YouTubeIcon size={12} /> : <Globe className="size-3" />}
          {label}
        </span>

        {p.status === "loading" && !p.title ? (
          <Shimmer className="h-4 w-3/4" />
        ) : (
          <p className="truncate text-sm font-medium text-fg-0">{p.title ?? "Untitled"}</p>
        )}

        <div className="flex min-h-5 items-center gap-2 text-xs" aria-live="polite">
          {p.status === "loading" && (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              <span className="text-fg-1">{loadingText}</span>
            </>
          )}
          {p.status === "ready" && (
            <>
              <span className="text-brand">
                <AnimatedCheck checked size={14} />
              </span>
              <span className="truncate text-fg-1">
                {p.author && `${p.author} · `}
                <span className="font-mono tabular-nums">{p.wordCount?.toLocaleString()}</span>{" "}
                words
              </span>
              {p.truncated && (
                <Badge variant="outline" className="border-warning/30 text-warning">
                  trimmed
                </Badge>
              )}
            </>
          )}
          {p.status === "error" && (
            <>
              <span className="text-danger">{p.message}</span>
              {p.onRetry && (
                <Button size="sm" variant="ghost" onClick={p.onRetry} disabled={p.disabled}>
                  <RotateCw />
                  Retry
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={p.onClear}
        disabled={p.disabled}
        aria-label={p.status === "error" ? "Paste text instead" : "Remove source"}
      >
        <X />
      </Button>
    </div>
  );
}
