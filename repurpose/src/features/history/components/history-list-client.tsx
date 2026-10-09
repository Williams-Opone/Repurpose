"use client";

import { usePathname, useRouter } from "next/navigation";

import { loadMoreGenerations } from "../page-actions";
import type { HistoryItem } from "../queries";
import { HistoryList } from "./history-list";

type Props = {
  items: HistoryItem[];
  cursor: string | null;
  filtered: boolean;
  q: string;
  format: string | null;
};

export function HistoryListClient({ items, cursor, filtered, q, format }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <HistoryList
      initialItems={items}
      initialCursor={cursor}
      filtered={filtered}
      onClearFilters={() => router.replace(pathname, { scroll: false })}
      loadMore={async (c) => {
        const res = await loadMoreGenerations({
          cursor: c,
          q: q || undefined,
          format: format ?? undefined,
        });
        return res.ok ? res.data : { items: [], nextCursor: null };
      }}
    />
  );
}
