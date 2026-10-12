import "server-only";

import { env } from "@/lib/env";
import { assertNever } from "@/lib/utils";

import { mockProvider } from "./mock";
import { paystackProvider } from "./paystack";
import type { BillingProvider } from "./types";

/** The only way features obtain a billing provider. */
export function getBillingProvider(): BillingProvider {
  switch (env.BILLING_PROVIDER) {
    case "paystack":
      return paystackProvider;
    case "mock":
      return mockProvider;
    default:
      return assertNever(env.BILLING_PROVIDER);
  }
}

export * from "./types";
