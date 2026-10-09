import "server-only";
import { and, count, desc, eq, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { generations, outputs } from "@/db/schema";
import { HISTORY_PAGE_SIZE } from "@/lib/constants";
import type { Format } from "@/types";

export type HistoryFilters = { q?: string; format?: Format };

export type HistoryItem = {
  id: string;
  title: string;
  sourceType: (typeof generations.$inferSelect)["sourceType"];
  formats: Format[];
  status: (typeof generations.$inferSelect)["status"];
  createdAt: Date;
  voiceName: string | null;
  outputCount: number;
};

export type HistoryPage = { items: HistoryItem[]; nextCursor: string | null };

/* ---------- Cursor (keyset on createdAt, id) ---------- */

export const encodeCursor = (createdAt: Date, id: string) => `${createdAt.toISOString()}|${id}`;

function decodeCursor(cursor: string | null | undefined): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const [iso, id] = cursor.split("|");
  if (!iso || !id) return null;
  const createdAt = new Date(iso);
  return Number.isNaN(createdAt.getTime()) ? null : { createdAt, id };
}

/* ---------- Where clause ---------- */

function buildWhere(
  userId: string,
  filters: HistoryFilters,
  cursor: string | null,
): SQL | undefined {
  const parts: Array<SQL | undefined> = [
    eq(generations.userId, userId),
    isNull(generations.deletedAt),
  ];

  const q = filters.q?.trim();
  if (q) {
    const needle = `%${q}%`;
    parts.push(
      or(ilike(generations.sourceTitle, needle), ilike(generations.sourceContent, needle)),
    );
  }

  if (filters.format) {
    // jsonb containment: formats @> '["twitter_thread"]'
    parts.push(sql`${generations.formats} @> ${JSON.stringify([filters.format])}::jsonb`);
  }

  const c = decodeCursor(cursor);
  if (c) {
    parts.push(
      or(
        lt(generations.createdAt, c.createdAt),
        and(eq(generations.createdAt, c.createdAt), lt(generations.id, c.id)),
      ),
    );
  }

  return and(...parts);
}

/* ---------- Queries ---------- */

export async function listGenerations(
  userId: string,
  { filters = {}, cursor = null }: { filters?: HistoryFilters; cursor?: string | null } = {},
): Promise<HistoryPage> {
  const rows = await db.query.generations.findMany({
    where: buildWhere(userId, filters, cursor),
    orderBy: [desc(generations.createdAt), desc(generations.id)],
    limit: HISTORY_PAGE_SIZE + 1, // one extra tells us whether another page exists
    columns: {
      id: true,
      sourceTitle: true,
      sourceType: true,
      formats: true,
      status: true,
      createdAt: true,
    },
    with: {
      voice: { columns: { name: true } },
      outputs: { columns: { id: true } },
    },
  });

  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, HISTORY_PAGE_SIZE) : rows;
  const last = page.at(-1);

  return {
    items: page.map((r) => ({
      id: r.id,
      title: r.sourceTitle?.trim() || "Untitled",
      sourceType: r.sourceType,
      formats: r.formats,
      status: r.status,
      createdAt: r.createdAt,
      voiceName: r.voice?.name ?? null,
      outputCount: r.outputs.length,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function countGenerations(userId: string, filters: HistoryFilters = {}) {
  const [row] = await db
    .select({ value: count() })
    .from(generations)
    .where(buildWhere(userId, filters, null));
  return row?.value ?? 0;
}

/** Source only — used by /workspace?from=<id> to prefill without copying outputs. */
export async function getGenerationSource(generationId: string, userId: string) {
  const row = await db.query.generations.findFirst({
    where: and(
      eq(generations.id, generationId),
      eq(generations.userId, userId),
      isNull(generations.deletedAt),
    ),
    columns: {
      sourceType: true,
      sourceTitle: true,
      sourceUrl: true,
      sourceContent: true,
      formats: true,
      voiceId: true,
    },
  });
  return row ?? null;
}

export { outputs };
