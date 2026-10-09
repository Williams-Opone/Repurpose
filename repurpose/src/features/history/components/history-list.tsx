"use client";

import { useState, useTransition } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";

import { deleteGeneration, restoreGeneration } from "../actions";
import type { HistoryItem } from "../queries";
import { HistoryEmpty } from "./history-empty";
import { HistoryRow } from "./history-row";

type Props = {
  initialItems: HistoryItem[];
  initialCursor: string | null;
  filtered: boolean;
  onClearFilters: () => void;
  loadMore: (cursor: string) => Promise<{ items: HistoryItem[]; nextCursor: string | null }>;
};

export function HistoryList({
  initialItems,
  initialCursor,
  filtered,
  onClearFilters,
  loadMore,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  async function remove(item: HistoryItem) {
    setItems((xs) => xs.filter((x) => x.id !== item.id)); // optimistic
    const res = await deleteGeneration({ generationId: item.id });
    if (!res.ok) {
      setItems(initialItems);
      toast.error(res.message);
      return;
    }
    toast("Generation deleted", {
      description: item.title,
      action: {
        label: "Undo",
        onClick: async () => {
          const restored = await restoreGeneration({ generationId: item.id });
          if (!restored.ok) {
            toast.error(restored.message);
            return;
          }
          setItems((xs) =>
            [...xs, item].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          );
        },
      },
    });
  }

  function more() {
    if (!cursor) return;
    startLoading(async () => {
      const page = await loadMore(cursor);
      setItems((xs) => [...xs, ...page.items]);
      setCursor(page.nextCursor);
    });
  }

  if (items.length === 0) return <HistoryEmpty filtered={filtered} onClear={onClearFilters} />;

  return (
    <div className="flex flex-col gap-6">
      <StaggerContainer className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <StaggerItem key={item.id} layout>
              <HistoryRow item={item} onDelete={() => void remove(item)} />
            </StaggerItem>
          ))}
        </AnimatePresence>
      </StaggerContainer>

      {cursor && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={more} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
