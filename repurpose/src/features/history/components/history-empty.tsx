import Link from "next/link";
import { History, SearchX } from "lucide-react";

import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Button, buttonVariants } from "@/components/ui/button";

export function HistoryEmpty({ filtered, onClear }: { filtered: boolean; onClear?: () => void }) {
  return (
    <StaggerContainer className="mx-auto flex max-w-sm flex-col items-center gap-4 pt-20 text-center">
      <StaggerItem>
        <span className="grid size-12 place-items-center rounded-lg bg-bg-2 text-fg-1">
          {filtered ? <SearchX className="size-5" /> : <History className="size-5" />}
        </span>
      </StaggerItem>
      <StaggerItem>
        <h2 className="font-serif text-3xl">
          {filtered ? "Nothing matches that." : "Your first generation lands here."}
        </h2>
      </StaggerItem>
      <StaggerItem>
        <p className="text-sm text-fg-1">
          {filtered
            ? "Try a different word, or clear the filters."
            : "Everything you create is saved automatically — source, outputs, and your edits."}
        </p>
      </StaggerItem>
      <StaggerItem>
        {filtered ? (
          <Button variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Link href="/workspace" className={buttonVariants()}>
            Create something
          </Link>
        )}
      </StaggerItem>
    </StaggerContainer>
  );
}
