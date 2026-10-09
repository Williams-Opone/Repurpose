import { z } from "zod";

import { Topbar } from "@/components/layout/topbar";
import { countGenerations, listGenerations } from "@/features/history";
import { HistoryFilters } from "@/features/history/components/history-filters";
import { HistoryListClient } from "@/features/history/components/history-list-client";
import { requireUserId } from "@/lib/auth";
import { FORMATS } from "@/types";

export const metadata = { title: "History" };

const SearchParamsSchema = z.object({
  q: z.string().max(100).optional(),
  format: z.enum(FORMATS).optional(),
});

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const raw = await searchParams;
  const parsed = SearchParamsSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};
  const filtered = Boolean(filters.q || filters.format);

  const [page, total] = await Promise.all([
    listGenerations(userId, { filters }),
    countGenerations(userId, filters),
  ]);

  return (
    <>
      <Topbar
        title="History"
        actions={
          <span className="font-mono text-xs text-fg-2">
            {total} generation{total === 1 ? "" : "s"}
          </span>
        }
      />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <HistoryFilters q={filters.q ?? ""} format={filters.format ?? null} />
          <HistoryListClient
            items={page.items}
            cursor={page.nextCursor}
            filtered={filtered}
            q={filters.q ?? ""}
            format={filters.format ?? null}
          />
        </div>
      </main>
    </>
  );
}
