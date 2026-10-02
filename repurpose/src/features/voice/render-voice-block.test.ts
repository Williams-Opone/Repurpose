import { describe, expect, it } from "vitest";

import type { VoiceProfile } from "@/types";

import { pickSamples, renderVoiceBlock } from "./render-voice-block";

const profile: VoiceProfile = {
  tone: ["direct", "dry"],
  sentenceLength: "short",
  vocabulary: { favors: ["ship"], avoids: [] },
  structuralHabits: ["opens with a claim"],
  formatting: { emojis: "never", hashtags: false, lists: true },
  signaturePhrases: [],
  pointOfView: "first-singular",
  summary: "You write like a tired engineer who is right.",
};

const samples = [
  { platform: "twitter" as const, content: "Tweet one." },
  { platform: "twitter" as const, content: "Tweet two." },
  { platform: "linkedin" as const, content: "A LinkedIn post." },
];

describe("renderVoiceBlock", () => {
  it("includes the profile facts and omits empty sections", () => {
    const out = renderVoiceBlock(profile, []);
    expect(out).toContain("Summary: You write like a tired engineer who is right.");
    expect(out).toContain("Tone: direct; dry");
    expect(out).toContain("Point of view: First person (I)");
    expect(out).not.toContain("Avoids:");
    expect(out).not.toContain("Signature phrases:");
    expect(out).not.toContain("<sample");
  });

  it("caps samples and wraps them in delimiters", () => {
    const out = renderVoiceBlock(profile, samples, { maxSamples: 2 });
    expect(out.match(/<sample /g)).toHaveLength(2);
    expect(out).toContain('<sample platform="linkedin">');
  });

  it("truncates long samples with an ellipsis", () => {
    const long = [{ platform: "blog" as const, content: "x".repeat(5_000) }];
    const out = renderVoiceBlock(profile, long);
    expect(out).toContain("…");
    expect(out.length).toBeLessThan(2_500);
  });
});

describe("pickSamples", () => {
  it("prefers platform diversity, then fills", () => {
    expect(pickSamples(samples, 2).map((s) => s.platform)).toEqual(["twitter", "linkedin"]);
    expect(pickSamples(samples, 3)).toHaveLength(3);
  });
});
