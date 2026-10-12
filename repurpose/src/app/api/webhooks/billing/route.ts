import { eq } from "drizzle-orm";

import { db } from "@/db";
import { processedEvents } from "@/db/schema";
import {
  applyRemoteSubscription,
  endSubscription,
  getBillingProvider,
  notePaymentFailure,
} from "@/features/billing";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const provider = getBillingProvider();

  // Raw body first — parsing would break signature verification.
  const rawBody = await req.text();

  const event = await provider.parseWebhook(rawBody, req.headers);
  if (!event) {
    logger.warn("billing webhook: invalid signature", { provider: provider.id });
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "ignored") {
    return new Response(null, { status: 204 });
  }

  // Claim before working. Replays find the row and no-op.
  const claimed = await db
    .insert(processedEvents)
    .values({ id: event.id, provider: provider.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: processedEvents.id });

  if (claimed.length === 0) {
    logger.info("billing webhook: duplicate ignored", { eventId: event.id, type: event.type });
    return new Response(null, { status: 204 });
  }

  try {
    switch (event.type) {
      case "subscription.active":
        await applyRemoteSubscription(event.subscription);
        break;
      case "subscription.ended":
        await endSubscription(event.providerSubscriptionId);
        break;
      case "payment.failed":
        await notePaymentFailure(event.providerSubscriptionId);
        break;
    }
  } catch (e) {
    // Release the claim so the provider's retry can actually retry.
    await db
      .delete(processedEvents)
      .where(eq(processedEvents.id, event.id))
      .catch(() => undefined);
    logger.error("billing webhook failed", {
      eventId: event.id,
      type: event.type,
      cause: String(e),
    });
    return new Response("Handler failed", { status: 500 });
  }

  logger.info("billing webhook handled", { eventId: event.id, type: event.type });
  return new Response(null, { status: 204 });
}
