export const PLATFORM_META: Record<Platform, { label: string }> = {
  twitter: { label: "X / Twitter" },
  linkedin: { label: "LinkedIn" },
  newsletter: { label: "Newsletter" },
  instagram: { label: "Instagram" },
  youtube: { label: "YouTube" },
  blog: { label: "Blog" },
};
export const PLATFORMS = [
  "twitter",
  "linkedin",
  "newsletter",
  "instagram",
  "youtube",
  "blog",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const FORMATS = [
  "twitter_thread",
  "linkedin_post",
  "newsletter_section",
  "instagram_caption",
  "youtube_description",
] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_META: Record<
  Format,
  { label: string; description: string; platform: Platform }
> = {
  twitter_thread: {
    label: "X / Twitter thread",
    description: "Punchy, one idea per tweet",
    platform: "twitter",
  },
  linkedin_post: {
    label: "LinkedIn post",
    description: "Professional, story-driven, line breaks",
    platform: "linkedin",
  },
  newsletter_section: {
    label: "Newsletter section",
    description: "Conversational, skimmable, with a takeaway",
    platform: "newsletter",
  },
  instagram_caption: {
    label: "Instagram caption",
    description: "Hook first, short lines, tasteful hashtags",
    platform: "instagram",
  },
  youtube_description: {
    label: "YouTube description",
    description: "SEO-aware summary with timestamps slot",
    platform: "youtube",
  },
};

export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export const SOURCE_TYPES = ["paste", "youtube", "url"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const GENERATION_STATUSES = ["pending", "streaming", "complete", "failed"] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];
/* ---------- JSON column shapes (owned here so db/ never imports features/) ---------- */

export type VoiceProfile = {
  tone: string[];
  sentenceLength: "short" | "mixed" | "long";
  vocabulary: { favors: string[]; avoids: string[] };
  structuralHabits: string[];
  formatting: { emojis: "never" | "rare" | "frequent"; hashtags: boolean; lists: boolean };
  signaturePhrases: string[];
  pointOfView: "first-singular" | "first-plural" | "second" | "mixed";
  summary: string;
};

// Structured output per format. Phase 6 format modules produce exactly these shapes.
export type OutputContent =
  | { kind: "thread"; tweets: string[] }
  | { kind: "post"; body: string }
  | { kind: "newsletter"; subject: string; body: string }
  | { kind: "caption"; body: string; hashtags: string[] }
  | { kind: "description"; body: string };

export type SubscriptionStatus =
  "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";
