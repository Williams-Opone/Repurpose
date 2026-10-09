"use server";

import { z } from "zod";

import { authedAction } from "@/lib/safe-action";
import { FORMATS } from "@/types";

import { listGenerations } from "./queries";

const LoadMoreSchema = z.object({
  cursor: z.string().min(1),
  q: z.string().max(100).optional(),
  format: z.enum(FORMATS).optional(),
});

export const loadMoreGenerations = authedAction(
  LoadMoreSchema,
  async ({ cursor, q, format }, { userId }) =>
    listGenerations(userId, { cursor, filters: { q, format } }),
);
