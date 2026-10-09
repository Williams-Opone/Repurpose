"use client";

import Link from "next/link";
import { FilePlus2, MoreHorizontal, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { PlatformIcon } from "@/components/icons/platforms";
import { hoverLift } from "@/components/motion/motion.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FORMAT_META } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

import type { HistoryItem } from "../queries";

const SOURCE_LABEL: Record<HistoryItem["sourceType"], string> = {
  paste: "Pasted",
  youtube: "YouTube",
  url: "Article",
};

export function HistoryRow({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  return (
    <motion.article
      layout
      whileHover={hoverLift}
      className="group relative flex items-center gap-4 rounded-md surface-1 p-4 transition-colors hover:border-line-strong"
    >
      {/* Full-row link sits beneath the menu so the menu stays clickable. */}
      <Link
        href={`/workspace/${item.id}`}
        className="absolute inset-0 rounded-md"
        aria-label={item.title}
      />

      <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-fg-0">{item.title}</h3>
          {item.status === "failed" && (
            <Badge variant="outline" className="border-danger/30 text-danger">
              failed
            </Badge>
          )}
        </div>
        <p className="flex items-center gap-1.5 font-mono text-xs text-fg-2">
          {SOURCE_LABEL[item.sourceType]}
          <span aria-hidden>·</span>
          {item.outputCount} output{item.outputCount === 1 ? "" : "s"}
          {item.voiceName && (
            <>
              <span aria-hidden>·</span>
              <span className="max-w-32 truncate">{item.voiceName}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <time dateTime={item.createdAt.toISOString()}>{formatRelativeTime(item.createdAt)}</time>
        </p>
      </div>

      <div className="pointer-events-none hidden items-center gap-2 text-fg-2 sm:flex">
        {item.formats.map((f) => (
          <PlatformIcon key={f} platform={FORMAT_META[f].platform} size={14} />
        ))}
      </div>

      <div className="relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Actions"
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem render={<Link href={`/workspace?from=${item.id}`} />}>
              <FilePlus2 />
              Use as new source
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.article>
  );
}
