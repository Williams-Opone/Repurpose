import type { NextRequest } from "next/server";
import type { UserJSON } from "@clerk/nextjs/server";
import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks";

import { db } from "@/db";
import { processedEvents } from "@/db/schema";
import { deleteUser, upsertUser, type IdentityInput } from "@/lib/auth";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

function toIdentity(d: UserJSON): IdentityInput {
  const primary =
    d.email_addresses.find((e) => e.id === d.primary_email_address_id) ?? d.email_addresses[0];
  const name = [d.first_name, d.last_name].filter(Boolean).join(" ");
  return {
    id: d.id,
    email: primary?.email_address ?? null,
    name: name || null,
    imageUrl: d.image_url ?? null,
  };
}

export async function POST(req: NextRequest) {
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }

  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(req, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET });
  } catch (e) {
    logger.warn("clerk webhook: invalid signature", { cause: String(e) });
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: svix retries on any non-2xx; the ledger makes replays no-ops.
  const eventId = req.headers.get("svix-id") ?? `${evt.type}:${Date.now()}`;
  const claimed = await db
    .insert(processedEvents)
    .values({ id: eventId, provider: "clerk", type: evt.type })
    .onConflictDoNothing()
    .returning({ id: processedEvents.id });

  if (claimed.length === 0) {
    return new Response(null, { status: 204 }); // already handled
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated":
      await upsertUser(toIdentity(evt.data));
      break;
    case "user.deleted":
      if (evt.data.id) await deleteUser(evt.data.id);
      break;
    default:
      break; // we only subscribe to user.* events
  }

  logger.info("clerk webhook handled", { type: evt.type, eventId });
  return new Response(null, { status: 204 });
}
