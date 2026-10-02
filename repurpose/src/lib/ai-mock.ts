import "server-only";
import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";

import type { VoiceProfile } from "@/types";

export const MOCK_VOICE_PROFILE: VoiceProfile = {
  tone: ["direct", "dry", "quietly confident", "allergic to hype"],
  sentenceLength: "mixed",
  vocabulary: {
    favors: ["ship", "the boring part", "here's the thing", "nobody tells you"],
    avoids: ["corporate buzzwords", "exclamation marks", "rhetorical 'Right?'"],
  },
  structuralHabits: [
    "opens with a one-line claim, no warm-up",
    "one idea per paragraph, often a single sentence",
    "ends on the point, not a call to action",
  ],
  formatting: { emojis: "never", hashtags: false, lists: true },
  signaturePhrases: ["here's the thing", "the boring part is the whole job"],
  pointOfView: "first-singular",
  summary:
    "You write like someone explaining a hard-won lesson to a smart friend: short claims, zero hype, and a habit of naming the unglamorous part everyone skips. Your confidence comes from specifics, not volume.",
};

// Fixture is picked by a marker that appears in the system prompt of each task.
const FIXTURES: Array<{ marker: string; value: unknown }> = [
  { marker: "writing-style analyst", value: MOCK_VOICE_PROFILE },
];

function pickFixture(system: string): unknown {
  return FIXTURES.find((f) => system.includes(f.marker))?.value ?? { ok: true };
}

function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

export function mockLanguageModel(): LanguageModel {
  return new MockLanguageModelV3({
    doStream: async (options) => {
      const system = options.prompt
        .filter((m) => m.role === "system")
        .map((m) => (typeof m.content === "string" ? m.content : ""))
        .join("\n");
      const parts = chunk(JSON.stringify(pickFixture(system)), 8);

      return {
        stream: simulateReadableStream({
          initialDelayInMs: 400,
          chunkDelayInMs: 20, // ~human reading speed, so you can judge the UI choreography
          chunks: [
            { type: "text-start", id: "0" },
            ...parts.map((delta) => ({ type: "text-delta" as const, id: "0", delta })),
            { type: "text-end", id: "0" },
            {
              type: "finish",
              // V3 spec: structured finish reason + structured usage
              finishReason: { unified: "stop", raw: "stop" },
              usage: {
                inputTokens: { total: 120, noCache: 120, cacheRead: 0, cacheWrite: 0 },
                outputTokens: { total: 240, text: 240, reasoning: 0 },
              },
            },
          ],
        }),
      };
    },
  });
}