import { normalizeText } from "@/features/ingest/normalize";

import { FormatValidationError } from "./types";

export { normalizeText };

/** Cut at a paragraph, then sentence, then word boundary — never mid-word. */
export function truncateAtBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const w = text.slice(0, max);

  const para = w.lastIndexOf("\n\n");
  if (para > max * 0.5) return w.slice(0, para).trimEnd();

  const sentence = Math.max(w.lastIndexOf(". "), w.lastIndexOf("! "), w.lastIndexOf("? "));
  if (sentence > max * 0.5) return w.slice(0, sentence + 1);

  const space = w.lastIndexOf(" ");
  return `${(space > 0 ? w.slice(0, space) : w).trimEnd()}…`;
}

/** "1/ ", "3/9 ", "2. ", "4) ", "(5) " at the start of a line. */
export function stripLeadingNumbering(text: string): string {
  return text.replace(/^\s*\(?\d{1,2}\)?\s*(?:\/\s*\d{0,2}|[.):-])\s+/, "");
}

export function requireText(text: string, minChars: number, label: string): string {
  const t = text.trim();
  if (t.length < minChars) {
    throw new FormatValidationError(`${label} came back too short (${t.length} chars).`);
  }
  return t;
}
