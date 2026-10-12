#!/usr/bin/env node
// Sends a correctly signed webhook to the local app. No ngrok required.
//   pnpm webhook mock '{"event":"subscription.active","userId":"user_123"}'
//   pnpm webhook paystack ./fixtures/subscription.create.json
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const [, , provider = "mock", payloadArg = '{"event":"subscription.active"}'] = process.argv;
const url = process.env.APP_URL ?? "http://localhost:3000/api/webhooks/billing";
const body = payloadArg.startsWith("{") ? payloadArg : readFileSync(payloadArg, "utf8");

const headers = { "content-type": "application/json" };
if (provider === "paystack") {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY must be set to sign paystack webhooks");
  headers["x-paystack-signature"] = createHmac("sha512", secret).update(body).digest("hex");
}

try {
  const res = await fetch(url, { method: "POST", headers, body });
  console.log(`${res.status} ${res.statusText}`, (await res.text()) || "(empty)");
} catch (e) {
  if (e?.cause?.code === "ECONNREFUSED" || e?.code === "ECONNREFUSED") {
    console.error(`✗ Nothing listening at ${url}\n  Start the app first:  pnpm dev`);
    process.exit(1);
  }
  throw e;
}
