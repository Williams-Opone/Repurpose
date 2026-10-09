"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FORMATS, FORMAT_META, type Format } from "@/types";

type Props = { q: string; format: Format | null };

export function HistoryFilters({ q, format }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(q);
  const [pending, startTransition] = useTransition();

  function apply(next: { q?: string; format?: Format | null }) {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : draft;
    const nextFormat = next.format !== undefined ? next.format : format;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextFormat) params.set("format", nextFormat);
    const query = params.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  }

  const applyDebounced = useDebouncedCallback(
    (value: string) => apply({ q: value }),
    SEARCH_DEBOUNCE_MS,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-2" />
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            applyDebounced(e.target.value);
          }}
          placeholder="Search sources…"
          aria-label="Search history"
          className="h-8 w-56 pr-7 pl-8 text-sm"
        />
        {draft && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setDraft("");
              apply({ q: "" });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-fg-2 hover:text-fg-0"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by format">
        {FORMATS.map((f) => {
          const active = f === format;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ format: active ? null : f })}
              className={cn(
                "h-7 rounded-sm border px-2 text-xs transition-colors",
                active
                  ? "border-brand/40 bg-brand/10 text-fg-0"
                  : "border-line text-fg-1 hover:border-line-strong hover:text-fg-0",
              )}
            >
              {FORMAT_META[f].label}
            </button>
          );
        })}
      </div>

      <span
        aria-live="polite"
        className={cn(
          "font-mono text-xs text-fg-2 transition-opacity",
          pending ? "opacity-100" : "opacity-0",
        )}
      >
        filtering…
      </span>
    </div>
  );
}
