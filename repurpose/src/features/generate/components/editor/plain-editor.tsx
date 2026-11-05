"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function Caret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 animate-pulse bg-brand align-text-bottom"
    />
  );
}

type Props = {
  value: string;
  onChange?: (value: string) => void;
  streaming?: boolean;
  ariaLabel: string;
  className?: string;
  singleLine?: boolean;
};

/** Plain text in, plain text out. Read-only when no onChange; auto-grows when editable. */
export function PlainEditor({
  value,
  onChange,
  streaming,
  ariaLabel,
  className,
  singleLine,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, onChange]);

  const base = cn("w-full text-[15px] leading-relaxed whitespace-pre-wrap text-fg-0", className);

  if (!onChange) {
    return (
      <div className={base}>
        {value}
        {streaming && <Caret />}
      </div>
    );
  }

  return (
    <textarea
      ref={ref}
      aria-label={ariaLabel}
      value={value}
      rows={1}
      spellCheck
      onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
      onKeyDown={(e) => {
        if (singleLine && e.key === "Enter") e.preventDefault();
      }}
      className={cn(
        base,
        "-mx-1 field-sizing-content resize-none overflow-hidden rounded-sm bg-transparent px-1",
        "transition-colors hover:bg-bg-2/60 focus:bg-bg-2 focus:outline-none",
      )}
    />
  );
}
