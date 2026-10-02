import { MAX_SOURCE_TITLE_CHARS, MAX_SOURCE_WORDS } from "@/lib/constants";
import { countWords } from "@/lib/utils";
import type { SourceType } from "@/types";

import type { Source } from "./types";

export function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ") // nbsp
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cuts after `max` words, preserving the original whitespace up to the cut. */
export function truncateToWords(text: string, max: number): { text: string; truncated: boolean } {
  const tokens = text.split(/(\s+)/);
  let words = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i]?.trim()) continue;
    words++;
    if (words > max) {
      return { text: tokens.slice(0, i).join("").trimEnd(), truncated: true };
    }
  }
  return { text, truncated: false };
}

/** First non-empty line, markdown markers stripped, cut at a word boundary. */
export function deriveTitle(text: string, max = MAX_SOURCE_TITLE_CHARS): string | null {
  const first = text
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (!first) return null;

  const clean = first
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[*_>-]+\s*/, "")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

const TS_LINE = /^\[?\(?\d{1,2}:\d{2}(?::\d{2})?\)?\]?$/;
const TS_LEAD = /^\[?\(?\d{1,2}:\d{2}(?::\d{2})?\)?\]?\s*[-–—:]?\s*/;

/** Removes "0:42" lines and leading "[01:23] " markers from pasted transcripts. */
export function stripTimestamps(text: string): string {
  return text
    .split("\n")
    .filter((l) => !TS_LINE.test(l.trim()))
    .map((l) => l.replace(TS_LEAD, ""))
    .join("\n");
}

type BuildInput = {
  type: SourceType;
  text: string;
  title?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  author?: string | null;
};

export function buildSource(input: BuildInput): Source {
  const raw = input.type === "youtube" ? stripTimestamps(input.text) : input.text;
  const { text, truncated } = truncateToWords(normalizeText(raw), MAX_SOURCE_WORDS);

  return {
    type: input.type,
    title: input.title?.trim() || deriveTitle(text),
    url: input.url ?? null,
    text,
    wordCount: countWords(text),
    truncated,
    thumbnailUrl: input.thumbnailUrl ?? null,
    author: input.author?.trim() || null,
  };
}
