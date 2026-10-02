"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { PlatformIcon } from "@/components/icons/platforms";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SAMPLE_CHARS, MIN_SAMPLE_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PLATFORM_META, PLATFORMS, type Platform } from "@/types";

import type { SampleInput as SampleInputValue } from "../schema";

type Props = {
  onAdd: (sample: SampleInputValue) => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
};

export function SampleInput({ onAdd, disabled, compact }: Props) {
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [content, setContent] = useState("");

  const len = content.trim().length;
  const tooShort = len < MIN_SAMPLE_CHARS;
  const tooLong = len > MAX_SAMPLE_CHARS;
  const valid = !tooShort && !tooLong;

  async function add() {
    if (!valid || disabled) return;
    await onAdd({ platform, content: content.trim() });
    setContent("");
  }

  return (
    <div className={cn("flex flex-col gap-3 rounded-lg surface-2", compact ? "p-3" : "p-4")}>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Platform">
        {PLATFORMS.map((p) => {
          const active = p === platform;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPlatform(p)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-sm border px-2 text-xs transition-colors",
                active
                  ? "border-brand/40 bg-brand/10 text-fg-0"
                  : "border-line text-fg-1 hover:border-line-strong hover:text-fg-0",
              )}
            >
              <PlatformIcon platform={p} size={12} />
              {PLATFORM_META[p].label}
            </button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled}
        rows={compact ? 4 : 7}
        placeholder="Paste something you actually wrote — a post, a newsletter intro, a long reply. The more it sounds like you, the better."
        className="resize-y bg-bg-1 text-sm leading-relaxed"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void add();
        }}
      />

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            tooLong ? "text-danger" : tooShort && len > 0 ? "text-warning" : "text-fg-2",
          )}
        >
          {len.toLocaleString()} / {MAX_SAMPLE_CHARS.toLocaleString()}
          {tooShort && len > 0 && ` · ${MIN_SAMPLE_CHARS - len} more to go`}
        </span>
        <Button size="sm" variant="secondary" onClick={add} disabled={!valid || disabled}>
          <Plus />
          Add sample
        </Button>
      </div>
    </div>
  );
}
