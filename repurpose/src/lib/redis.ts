import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { GENERATE_RATE_LIMIT_PER_MINUTE } from "./constants";
import { env } from "./env";
import { AppError } from "./errors";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const generateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(GENERATE_RATE_LIMIT_PER_MINUTE, "1 m"),
  prefix: "rl:generate",
  analytics: false,
});

/** Throws RATE_LIMITED (429) when the key is over its window. */
export async function assertRateLimit(limiter: Ratelimit, key: string): Promise<void> {
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    throw new AppError("RATE_LIMITED", `You're going a little fast. Try again in ${seconds}s.`);
  }
}
