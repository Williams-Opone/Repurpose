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
// Fixture is picked by a marker in the system prompt. Format markers are checked first (more specific).
const FIXTURES: Array<{ marker: string; value: unknown }> = [
  {
    marker: "Format key: twitter_thread",
    value: {
      tweets: [
        "Most teams don't have a shipping problem. They have a deciding problem.",
        'Every delayed launch I\'ve seen traces back to the same thing: nobody wanted to be the person who said "this is enough."',
        'So the scope grows. Quietly. One "while we\'re in there" at a time.',
        "The fix isn't a better roadmap. It's one person with the authority to call it done — and the stomach to be wrong in public.",
        "The boring part is the whole job. Decide, ship, find out.",
      ],
    },
  },
  {
    marker: "Format key: linkedin_post",
    value: {
      body: 'We shipped three weeks late and nobody could tell me why.\n\nNot because people were slow. Everyone was working. The problem was that no single person was allowed to say "this is enough."\n\nSo scope grew the way scope always grows: one reasonable addition at a time, each one defensible, none of them planned.\n\nHere\'s what changed it. We named one owner per release. Not a committee — one person whose job was to say no and to be wrong in public if the call was bad.\n\nThe next release shipped on the day we said it would. Same team. Same backlog.\n\nThe boring part is the whole job.',
    },
  },
  {
    marker: "Format key: newsletter_section",
    value: {
      subject: "Why your launch is late (it isn't the engineers)",
      body: "I spent most of last quarter trying to figure out why a release that should have taken four weeks took seven.\n\nThe tempting answer was velocity. It wasn't velocity. Everyone was shipping. The real answer was that nobody had the authority to stop.\n\n**Scope grows in reasonable increments.** Each addition had a champion and a good argument. None of them was the thing that made us late. All of them together were.\n\n**What fixed it**\n\nOne owner per release. Not a manager, not a committee — a single person whose job was to say \"this is enough\" and live with being wrong in public.\n\nThe next release landed on the date we picked, with the same team and the same backlog.\n\nIf your launches drift, don't start with the roadmap. Start by asking who is allowed to say no.",
    },
  },
  {
    marker: "Format key: instagram_caption",
    value: {
      body: "Your launch isn't late because of the engineers.\n\nIt's late because nobody is allowed to say \"this is enough.\"\n\nScope grows one reasonable idea at a time. Nobody plans it. Everybody defends it.\n\nWe fixed it with one rule: one owner per release. One person who gets to call it done.\n\nNext release shipped on the day. Same team.",
      hashtags: [
        "productmanagement",
        "shipping",
        "startuplessons",
        "buildinpublic",
        "engineeringleadership",
      ],
    },
  },
  {
    marker: "Format key: youtube_description",
    value: {
      body: 'Why software launches slip — and the one structural fix that stopped ours. For founders, PMs, and engineering leads tired of "almost done."\n\nIn this video I walk through a release that took seven weeks instead of four, why the usual explanation (velocity) was wrong, and how scope grows in small, defensible steps that nobody plans. Then the change that fixed it: a single named owner per release with the authority to call it done.\n\nTimestamps:\n00:00 Intro\n01:10 The seven-week release\n04:30 Why velocity wasn\'t the problem\n08:15 One owner per release\n12:40 What happened next',
    },
  },
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
