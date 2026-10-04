import "server-only";
import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.url(),

    // AI
    AI_PROVIDER: z.enum(["google", "anthropic", "mock"]).default("google"),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),

    GOOGLE_MODEL_ID: z.string().min(1).optional(),
    // Database
    DATABASE_URL: z.url().startsWith("postgres"),

    // Auth
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().startsWith("whsec_").optional(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().startsWith("/"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().startsWith("/"),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().startsWith("/"),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().startsWith("/"),

    // Transcripts
    SUPADATA_API_KEY: z.string().min(1).optional(),

    // Redis
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  })
  .superRefine((e, ctx) => {
    if (e.AI_PROVIDER === "google" && !e.GOOGLE_GENERATIVE_AI_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_GENERATIVE_AI_API_KEY"],
        message: "Required when AI_PROVIDER=google",
      });
    }
    if (e.AI_PROVIDER === "anthropic" && !e.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["ANTHROPIC_API_KEY"],
        message: "Required when AI_PROVIDER=anthropic",
      });
    }
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail loudly at boot. A missing secret should never become a runtime surprise.
  console.error("❌ Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = typeof env;
