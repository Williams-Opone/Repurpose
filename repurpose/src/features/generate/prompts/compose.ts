import type { Source } from "@/features/ingest/types";
import { FORMAT_META } from "@/types";

import type { FormatModule } from "./formats/types";
import { buildSystemPrompt } from "./system";

export type ComposeArgs = {
  module: FormatModule;
  source: Source;
  voiceBlock: string | null;
  /** Optional direction from the author, e.g. "shorter", "more contrarian". */
  instruction?: string | null;
  /** Why the previous attempt was rejected — fed back for the one retry. */
  previousError?: string | null;
};

const escapeAttr = (s: string) => s.replace(/[<>"&]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Neutralize a closing tag inside the content so the delimiter can't be broken. */
export const sanitizeSource = (text: string) => text.replace(/<\/?source\b/gi, "&lt;source");

export function composePrompt({
  module,
  source,
  voiceBlock,
  instruction,
  previousError,
}: ComposeArgs) {
  const system = buildSystemPrompt({ formatInstructions: module.instructions, voiceBlock });

  const prompt = [
    `Repurpose the source below into: ${FORMAT_META[module.format].label}.`,
    `<source type="${source.type}" title="${escapeAttr(source.title ?? "")}" words="${source.wordCount}">\n${sanitizeSource(source.text)}\n</source>`,
    instruction?.trim()
      ? `Additional direction from the author: ${JSON.stringify(instruction.trim())}`
      : null,
    previousError
      ? `Your previous attempt was rejected: ${previousError}. Produce a corrected version that satisfies every constraint.`
      : null,
  ]
    .filter((p): p is string => Boolean(p))
    .join("\n\n");

  return { system, prompt };
}
