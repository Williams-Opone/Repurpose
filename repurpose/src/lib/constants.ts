export const APP_NAME = "Repurpose";
// Brand voice
export const MIN_VOICE_SAMPLES = 2;
export const MAX_VOICE_SAMPLES = 6;
export const MIN_SAMPLE_CHARS = 80;
export const MAX_SAMPLE_CHARS = 4_000;
export const MAX_VOICES_PER_USER = 5;

// AI
export const AI_MODELS = {
  google: "gemini-2.5-flash", // swap to "gemini-2.5-pro" for stronger voice matching
  anthropic: "claude-sonnet-4-5",
} as const;
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
export const GENERATION_TIMEOUT_MS = 45_000;
export const MAX_FORMATS_PER_GENERATION = 5;
export const TWEET_MAX_CHARS = 280;
export const LINKEDIN_MAX_CHARS = 3_000;

// UX
export const AUTOSAVE_DEBOUNCE_MS = 800;
export const UNDO_WINDOW_MS = 5_000;
