import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { mockLanguageModel } from "./ai-mock";
import { AI_MODELS } from "./constants";
import { env } from "./env";
import { assertNever } from "./utils";

const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY });
const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

/** The only way features obtain a model. Provider is an env var; features never know which one. */
export function getModel(): LanguageModel {
  switch (env.AI_PROVIDER) {
    case "mock":
      return mockLanguageModel();
    case "google":
      return google(AI_MODELS.google);
    case "anthropic":
      return anthropic(AI_MODELS.anthropic);
    default:
      return assertNever(env.AI_PROVIDER);
  }
}
