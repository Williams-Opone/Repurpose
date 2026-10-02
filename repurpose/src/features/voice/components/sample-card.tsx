"use client";

import { X } from "lucide-react";

import { PlatformIcon } from "@/components/icons/platforms";
import { Button } from "@/components/ui/button";
import { PLATFORM_META, type Platform } from "@/types";

type Props = {
  platform: Platform;
  content: string;
  onRemove?: () => void;
  disabled?: boolean;
};

export function SampleCard({ platform, content, onRemove, disabled }: Props) {
  return (
    <article className="group flex flex-col gap-2.5 rounded-md surface-1 p-4">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-fg-1">
          <PlatformIcon platform={platform} size={14} />
          {PLATFORM_META[platform].label}
          <span className="font-mono text-fg-2">· {content.length.toLocaleString()} chars</span>
        </span>
        {onRemove && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove sample"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X />
          </Button>
        )}
      </header>
      <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-fg-1">
        {content}
      </p>
    </article>
  );
}
