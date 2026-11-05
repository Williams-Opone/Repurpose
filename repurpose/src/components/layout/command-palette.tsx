"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { CreditCard, History, Mic2, Plus, Settings, Sparkles } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useHotkeys } from "@/hooks/use-hotkeys";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openUserProfile } = useClerk();

  useHotkeys([{ key: "k", mod: true, allowInInputs: true, handler: () => setOpen((o) => !o) }]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Jump anywhere"
    >
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Create">
          <CommandItem onSelect={() => go("/workspace")}>
            <Sparkles /> New generation
          </CommandItem>
          <CommandItem onSelect={() => go("/voice/new")}>
            <Plus /> New brand voice
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/history")}>
            <History /> History
          </CommandItem>
          <CommandItem onSelect={() => go("/voice")}>
            <Mic2 /> Brand voice
          </CommandItem>
          <CommandItem onSelect={() => go("/billing")}>
            <CreditCard /> Billing
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              openUserProfile();
            }}
          >
            <Settings /> Manage account
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
