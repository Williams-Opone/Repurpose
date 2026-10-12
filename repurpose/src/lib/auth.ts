import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";

import { AppError } from "./errors";
import { logger } from "./logger";

export type IdentityInput = {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
};

/** For server actions / route handlers. Throws a typed error if unauthenticated. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new AppError("UNAUTHORIZED");
  return userId;
}

/**
 * Idempotent: creates or refreshes the user row, and guarantees a free-tier
 * subscription row exists. Called by BOTH the Clerk webhook and ensureUser().
 */
export async function upsertUser(input: IdentityInput): Promise<void> {
  await db.batch([
    db
      .insert(users)
      .values(input)
      .onConflictDoUpdate({
        target: users.id,
        set: { email: input.email, name: input.name, imageUrl: input.imageUrl },
      }),
    db.insert(subscriptions).values({ userId: input.id }).onConflictDoNothing(),
  ]);
}

export async function deleteUser(userId: string): Promise<void> {
  // FK cascades remove voices, samples, generations, outputs, subscription, usage.
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Fallback provisioning for the webhook race: a user can reach the app before
 * Clerk's user.created event arrives. Cheap read; writes only on first visit.
 * React cache() dedupes it within a single request.
 */
export const ensureUser = cache(async (userId: string): Promise<void> => {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true },
  });
  if (existing?.email) return; // fully provisioned

  const cu = await currentUser();
  if (!cu || cu.id !== userId) throw new AppError("UNAUTHORIZED");

  const addresses = cu.emailAddresses ?? [];
  await upsertUser({
    id: cu.id,
    email:
      cu.primaryEmailAddress?.emailAddress ??
      addresses.find((e) => e?.verification?.status === "verified")?.emailAddress ??
      addresses[0]?.emailAddress ??
      null,
    name: cu.fullName ?? null,
    imageUrl: cu.imageUrl ?? null,
  });
  logger.info("user provisioned via ensureUser", { userId });
});
/**
 * Billing needs an email. Clerk's `primaryEmailAddress` can be null on some OAuth flows,
 * so fall back to any verified address, then to our own users row.
 */
/**
 * Billing needs an email. Clerk's `primaryEmailAddress` can be null (and `emailAddresses`
 * can be missing entirely in some SDK shapes), so fall back to any address, then to our row.
 */
export async function getUserEmail(
  userId: string,
): Promise<{ email: string | null; name: string | null }> {
  const cu = await currentUser().catch(() => null);
  const addresses = cu?.emailAddresses ?? [];

  const fromClerk =
    cu?.primaryEmailAddress?.emailAddress ??
    addresses.find((e) => e?.verification?.status === "verified")?.emailAddress ??
    addresses[0]?.emailAddress ??
    null;

  if (fromClerk) return { email: fromClerk, name: cu?.fullName ?? null };

  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true, name: true },
  });
  return { email: row?.email ?? null, name: row?.name ?? cu?.fullName ?? null };
}
