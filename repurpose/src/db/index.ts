import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";

import * as schema from "./schema";

// HTTP driver: one fetch per query, ideal for serverless route handlers.
// Multi-statement atomicity uses db.batch(); Redis (Phase 6) handles quota atomicity.
const sql = neon(env.DATABASE_URL);

export const db = drizzle({ client: sql, schema, casing: "snake_case" });
export type Db = typeof db;
