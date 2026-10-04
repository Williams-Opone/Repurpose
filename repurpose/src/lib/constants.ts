export const APP_NAME = "Repurpose";
// Brand voice
export const MIN_VOICE_SAMPLES = 2;
export const MAX_VOICE_SAMPLES = 6;
export const MIN_SAMPLE_CHARS = 80;
export const MAX_SAMPLE_CHARS = 4_000;
export const MAX_VOICES_PER_USER = 5;

// AI
export const AI_MODELS = {
  google: "gemini-3.1-flash-lite", // separate (larger) free daily bucket; override with GOOGLE_MODEL_ID
  anthropic: "claude-sonnet-4-5",
} as const;

// Max simultaneous model calls per request. Free-tier Gemini keys 429 on a parallel burst.
export const MODEL_CONCURRENCY = { google: 2, anthropic: 5, mock: 5 } as const;
export const ANALYSIS_TIMEOUT_S = 60;
// Billing
export const FREE_QUOTA_PER_MONTH = 5;

// Ingestion
export const MAX_SOURCE_WORDS = 8_000;
export const SOURCE_WARN_WORDS = 7_000;
export const MIN_SOURCE_WORDS = 20;
export const MAX_SOURCE_CHARS = 60_000; // ≈ 8k words; hard cap for Zod
export const MAX_SOURCE_TITLE_CHARS = 120;
export const MAX_UPLOAD_BYTES = 1_000_000;
export const MAX_ARTICLE_BYTES = 2_000_000;
export const REMOTE_FETCH_TIMEOUT_MS = 25_000;

// Generation
export const GENERATION_TIMEOUT_MS = 45_000; // per format
export const GENERATE_MAX_DURATION_S = 60; // route handler ceiling
export const GENERATE_RATE_LIMIT_PER_MINUTE = 10;
export const MAX_FORMATS_PER_GENERATION = 5;
export const MAX_INSTRUCTION_CHARS = 200;
export const PLAN_CACHE_TTL_S = 60;

// Platform limits
export const TWEET_MAX_CHARS = 280;
export const MAX_THREAD_TWEETS = 15;
export const LINKEDIN_MAX_CHARS = 3_000;
export const NEWSLETTER_SUBJECT_MAX_CHARS = 80;
export const INSTAGRAM_MAX_CHARS = 2_200;
export const INSTAGRAM_MAX_HASHTAGS = 8;
export const YOUTUBE_DESCRIPTION_MAX_CHARS = 5_000;
// UX
export const AUTOSAVE_DEBOUNCE_MS = 800;
export const UNDO_WINDOW_MS = 5_000;
