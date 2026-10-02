"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Mic2, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type VoiceOption = { id: string; name: string; isDefault: boolean };

type Props = {
  voices: VoiceOption[];
  value: string | null;
  onChange: (voiceId: string) => void;
  className?: string;
};

export function VoiceSelector({ voices, value, onChange, className }: Props) {
  const current = voices.find((v) => v.id === value) ?? voices[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 items-center gap-2 rounded-sm border border-line bg-bg-1 px-2.5 text-sm transition-colors hover:border-line-strong",
              className,
            )}
          />
        }
      >
        <Mic2 className="size-3.5 text-fg-1" />
        <span className="max-w-40 truncate">{current?.name ?? "No voice"}</span>
        <ChevronsUpDown className="size-3.5 text-fg-2" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {voices.map((v) => (
          <DropdownMenuItem key={v.id} onClick={() => onChange(v.id)}>
            <span className="flex-1 truncate">{v.name}</span>
            {v.isDefault && <span className="font-mono text-[10px] text-fg-2">default</span>}
            {v.id === current?.id && <Check className="size-3.5 text-brand" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/voice/new" />}>
          <Plus />
          New voice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
