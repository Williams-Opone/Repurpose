import type { SourceType } from "@/types";

/** The ONLY shape content takes once it enters the system. Phase 6 accepts nothing else. */
export type Source = {
  type: SourceType;
  title: string | null;
  url: string | null;
  text: string;
  wordCount: number;
  /** True if the text was cut at MAX_SOURCE_WORDS. */
  truncated: boolean;
  /** YouTube only — we never proxy arbitrary article images. */
  thumbnailUrl: string | null;
  /** Channel name, byline, or site name. */
  author: string | null;
};
