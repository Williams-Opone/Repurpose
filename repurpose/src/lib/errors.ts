export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "PROVIDER_ERROR",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_INPUT: 400,
  QUOTA_EXCEEDED: 402,
  RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,
  INTERNAL: 500,
};

// Human-facing defaults. UI shows these, never raw error strings.
const MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have access to that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  INVALID_INPUT: "Something about that input didn't look right.",
  QUOTA_EXCEEDED: "You've used all your generations this month.",
  RATE_LIMITED: "You're going a little fast. Try again in a moment.",
  PROVIDER_ERROR: "Our AI provider hiccuped. Your quota was not charged.",
  INTERNAL: "Something went wrong on our side. We've been notified.",
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message?: string, options?: { cause?: unknown }) {
    super(message ?? MESSAGES[code], options); // ES2022 Error carries `cause` natively
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

export function toAppError(e: unknown): AppError {
  if (isAppError(e)) return e;
  return new AppError("INTERNAL", undefined, { cause: e });
}

// Shape every server action returns. Discriminated so callers must handle both.
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; message: string; issues?: Record<string, string[] | undefined> };
