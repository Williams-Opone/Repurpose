import type { Format, OutputContent } from "@/types";
import type { ErrorCode } from "@/lib/errors";

export type FormatState =
  | { status: "idle" }
  | { status: "streaming"; partial: unknown }
  | {
      status: "done";
      outputId: string;
      content: OutputContent;
      tokensUsed: number | null;
      /** Bumps on every regenerate so editors remount with fresh content. */
      revision: number;
    }
  | { status: "error"; message: string };

export type RequestError = { code: ErrorCode | "NETWORK"; message: string };

export type GenerationState = {
  generationId: string | null;
  running: boolean;
  formats: Partial<Record<Format, FormatState>>;
  requestError: RequestError | null;
};

export type InitialOutput = {
  format: Format;
  outputId: string;
  content: OutputContent;
  tokensUsed: number | null;
};

export const EMPTY_STATE: GenerationState = {
  generationId: null,
  running: false,
  formats: {},
  requestError: null,
};

/** Rebuild client state from a persisted generation (the /workspace/[id] page). */
export function initialStateFrom(
  args: { generationId: string; formats: Format[]; outputs: InitialOutput[] } | null,
): GenerationState {
  if (!args) return EMPTY_STATE;
  const formats: GenerationState["formats"] = {};
  for (const f of args.formats) {
    formats[f] = {
      status: "error",
      message: "This format didn't finish last time. Regenerate to try again.",
    };
  }
  for (const o of args.outputs) {
    formats[o.format] = {
      status: "done",
      outputId: o.outputId,
      content: o.content,
      tokensUsed: o.tokensUsed,
      revision: 0,
    };
  }
  return { generationId: args.generationId, running: false, formats, requestError: null };
}

/** Anything still streaming when the connection ends becomes a visible error. */
export function failStreaming(
  formats: GenerationState["formats"],
  message: string,
): GenerationState["formats"] {
  const out: GenerationState["formats"] = { ...formats };
  for (const [k, v] of Object.entries(out) as [Format, FormatState][]) {
    if (v.status === "streaming") out[k] = { status: "error", message };
  }
  return out;
}
