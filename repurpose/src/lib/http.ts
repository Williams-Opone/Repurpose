import "server-only";

import { toAppError } from "./errors";
import { logger } from "./logger";

/** Turn any thrown value into a JSON error response with the right status. */
export function errorResponse(e: unknown): Response {
  const err = toAppError(e);
  if (err.status >= 500) {
    logger.error("route failed", { code: err.code, cause: String(err.cause) });
  }
  return Response.json({ error: err.code, message: err.message }, { status: err.status });
}
