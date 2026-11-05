"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MAX_INSTRUCTION_CHARS } from "@/lib/constants";

const QUICK = ["Shorter", "Punchier", "More specific", "Less formal", "More contrarian"];

export function RegeneratePopover({
  onRegenerate,
  disabled,
}: {
  onRegenerate: (instruction?: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

  function go(text?: string) {
    setOpen(false);
    setInstruction("");
    onRegenerate(text?.trim() || undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button size="sm" variant="ghost" disabled={disabled} />}>
        <RefreshCw /> Regenerate
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-md float p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => go(q)}
                className="rounded-sm border border-line px-2 py-1 text-xs text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              go(instruction);
            }}
          >
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              maxLength={MAX_INSTRUCTION_CHARS}
              placeholder="Or tell it what to change…"
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
          <p className="text-[11px] text-fg-2">
            Regenerating is free and replaces your edits for this format.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
