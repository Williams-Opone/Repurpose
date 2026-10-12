import "server-only";
import { z } from "zod";

import { requireUserId } from "./auth";
import { env } from "./env";
import { type ActionResult, toAppError } from "./errors";
import { logger } from "./logger";

type Ctx = { userId: string };

const isDev = env.NODE_ENV !== "production";

export function authedAction<TSchema extends z.ZodType, TResult>(
  schema: TSchema,
  handler: (input: z.output<TSchema>, ctx: Ctx) => Promise<TResult>,
) {
  return async (raw: unknown): Promise<ActionResult<TResult>> => {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      const err = toAppError(e);
      return { ok: false, error: err.code, message: err.message };
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "INVALID_INPUT",
        message: "Please check the highlighted fields.",
        issues: z.flattenError(parsed.error).fieldErrors,
      };
    }

    try {
      const data = await handler(parsed.data, { userId });
      return { ok: true, data };
    } catch (e) {
      const err = toAppError(e);
      const cause = err.cause;
      const detail = cause instanceof Error ? cause.message : String(cause ?? err.message);

      if (err.status >= 500) {
        logger.error("action failed", {
          code: err.code,
          userId,
          message: detail,
          stack:
            cause instanceof Error ? cause.stack?.split("\n").slice(0, 8).join("\n") : undefined,
        });
      }

      // In dev, surface the real cause — hiding it costs more time than it saves.
      return {
        ok: false,
        error: err.code,
        message: isDev && err.status >= 500 ? `[dev] ${detail}` : err.message,
      };
    }
  };
}
