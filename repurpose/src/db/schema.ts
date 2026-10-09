import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Relative import on purpose: drizzle-kit reads this file outside Next's alias resolution.
import {
  FORMATS,
  GENERATION_STATUSES,
  PLANS,
  PLATFORMS,
  SOURCE_TYPES,
  type Format,
  type OutputContent,
  type SubscriptionStatus,
  type VoiceProfile,
} from "../types";

/* ---------- Enums (single source of truth is src/types) ---------- */

export const platformEnum = pgEnum("platform", PLATFORMS);
export const formatEnum = pgEnum("format", FORMATS);
export const planEnum = pgEnum("plan", PLANS);
export const sourceTypeEnum = pgEnum("source_type", SOURCE_TYPES);
export const generationStatusEnum = pgEnum("generation_status", GENERATION_STATUSES);

/* ---------- Shared columns ---------- */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* ---------- users ---------- */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id — we never mint our own
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  ...timestamps,
});

/* ---------- brand voice ---------- */

export const brandVoices = pgTable(
  "brand_voices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My voice"),
    // null until analysis completes
    profile: jsonb("profile").$type<VoiceProfile>(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("brand_voices_user_idx").on(t.userId)],
);

export const voiceSamples = pgTable(
  "voice_samples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voiceId: uuid("voice_id")
      .notNull()
      .references(() => brandVoices.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("voice_samples_voice_idx").on(t.voiceId)],
);

/* ---------- generations & outputs ---------- */

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // keep history even if the voice is deleted
    voiceId: uuid("voice_id").references(() => brandVoices.id, { onDelete: "set null" }),
    sourceType: sourceTypeEnum("source_type").notNull(),
    sourceTitle: text("source_title"),
    sourceUrl: text("source_url"),
    sourceContent: text("source_content").notNull(),
    formats: jsonb("formats").$type<Format[]>().notNull(),
    status: generationStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Soft delete powers the undo toast: durable, unlike a server-side timer.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("generations_user_created_idx").on(t.userId, t.createdAt.desc())],
);

export const outputs = pgTable(
  "outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    format: formatEnum("format").notNull(),
    // AI original — immutable after insert
    content: jsonb("content").$type<OutputContent>().notNull(),
    // user edits — null means "untouched", enabling "reset to original"
    editedContent: jsonb("edited_content").$type<OutputContent>(),
    tokensUsed: integer("tokens_used"),
    ...timestamps,
  },
  (t) => [uniqueIndex("outputs_generation_format_idx").on(t.generationId, t.format)],
);

/* ---------- billing ---------- */

export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("free"),
  status: text("status").$type<SubscriptionStatus>().notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  ...timestamps,
});

export const usage = pgTable(
  "usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // "YYYY-MM"
    count: integer("count").notNull().default(0),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.period] })],
);

// Idempotency ledger for ALL inbound webhooks (Clerk now, Stripe in Phase 9).
export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(), // provider's event id
  provider: text("provider").$type<"clerk" | "stripe">().notNull(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------- Relations (for db.query.*) ---------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
  voices: many(brandVoices),
  generations: many(generations),
}));

export const brandVoicesRelations = relations(brandVoices, ({ one, many }) => ({
  user: one(users, { fields: [brandVoices.userId], references: [users.id] }),
  samples: many(voiceSamples),
}));

export const voiceSamplesRelations = relations(voiceSamples, ({ one }) => ({
  voice: one(brandVoices, { fields: [voiceSamples.voiceId], references: [brandVoices.id] }),
}));

export const generationsRelations = relations(generations, ({ one, many }) => ({
  user: one(users, { fields: [generations.userId], references: [users.id] }),
  voice: one(brandVoices, { fields: [generations.voiceId], references: [brandVoices.id] }),
  outputs: many(outputs),
}));

export const outputsRelations = relations(outputs, ({ one }) => ({
  generation: one(generations, { fields: [outputs.generationId], references: [generations.id] }),
}));

/* ---------- Inferred types — derive, never redeclare ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BrandVoice = typeof brandVoices.$inferSelect;
export type NewBrandVoice = typeof brandVoices.$inferInsert;
export type VoiceSample = typeof voiceSamples.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type Output = typeof outputs.$inferSelect;
export type NewOutput = typeof outputs.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Usage = typeof usage.$inferSelect;
