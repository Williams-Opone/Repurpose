import { describe, expect, it } from "vitest";

import { TWEET_MAX_CHARS } from "@/lib/constants";

import { stripLeadingNumbering } from "./shared";
import { splitLongTweet, twitterThread } from "./twitter-thread";

describe("splitLongTweet", () => {
  it("leaves short tweets alone", () => {
    expect(splitLongTweet("Short and sweet.")).toEqual(["Short and sweet."]);
  });

  it("splits at sentence boundaries and never exceeds the limit", () => {
    const sentence = "This sentence is exactly fifty characters long, ok. ";
    const long = sentence.repeat(8); // ~400 chars
    const parts = splitLongTweet(long);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) {
      expect(p.length).toBeLessThanOrEqual(TWEET_MAX_CHARS);
      expect(p.endsWith(".")).toBe(true);
    }
    expect(parts.join(" ").replace(/\s+/g, " ")).toBe(long.trim().replace(/\s+/g, " "));
  });

  it("hard-cuts a token with no boundaries", () => {
    const parts = splitLongTweet("x".repeat(600));
    expect(parts.map((p) => p.length)).toEqual([280, 280, 40]);
  });
});

describe("stripLeadingNumbering", () => {
  it.each([
    ["1/ Hello", "Hello"],
    ["3/9 Hello", "Hello"],
    ["2. Hello", "Hello"],
    ["(4) Hello", "Hello"],
    ["10) Hello", "Hello"],
  ])("strips %s", (input, expected) => {
    expect(stripLeadingNumbering(input)).toBe(expected);
  });
  it("leaves real numbers alone", () => {
    expect(stripLeadingNumbering("2024 was wild")).toBe("2024 was wild");
    expect(stripLeadingNumbering("1-2 punch")).toBe("1-2 punch");
  });
});

describe("twitterThread.finalize", () => {
  it("normalizes, strips numbering, splits long tweets, and tags the kind", () => {
    const out = twitterThread.finalize({
      tweets: ["1/ First  point.", "", "2/ " + "Long sentence here. ".repeat(20)],
    });
    expect(out.kind).toBe("thread");
    if (out.kind !== "thread") return;
    expect(out.tweets[0]).toBe("First point.");
    expect(out.tweets.length).toBeGreaterThan(2);
    expect(out.tweets.every((t) => t.length <= TWEET_MAX_CHARS)).toBe(true);
  });

  it("rejects an effectively empty thread", () => {
    expect(() => twitterThread.finalize({ tweets: ["", "  "] })).toThrow(/at least 2/);
  });
});
