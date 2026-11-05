"use client";

import { FORMATS, type Format } from "@/types";

import { FormatCard } from "./format-card";

export function FormatPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: Format[];
  onChange: (f: Format[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1 font-mono text-[11px] tracking-wider text-fg-2 uppercase">
        Formats
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {FORMATS.map((f) => (
          <FormatCard
            key={f}
            format={f}
            checked={selected.includes(f)}
            disabled={disabled}
            onToggle={() =>
              onChange(selected.includes(f) ? selected.filter((x) => x !== f) : [...selected, f])
            }
          />
        ))}
      </div>
    </fieldset>
  );
}
