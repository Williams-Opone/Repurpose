import { describe, expect, it } from "vitest";

import {
  buildSource,
  deriveTitle,
  normalizeText,
  stripTimestamps,
  truncateToWords,
} from "./normalize";

describe("normalizeText", () => {
  it("normalizes line endings, whitespace runs, and blank-line stacks", () => {
    expect(normalizeText("a  b\t c\r\n\r\n\r\n\r\nd \u00A0e\u200B")).toBe("a b c\n\nd e");
  });
});

describe("truncateToWords", () => {
  it("leaves short text alone", () => {
    expect(truncateToWords("one two three", 5)).toEqual({
      text: "one two three",
      truncated: false,
    });
  });
  it("cuts at the word limit and keeps inner whitespace", () => {
    expect(truncateToWords("one two\n\nthree four five", 3)).toEqual({
      text: "one two\n\nthree",
      truncated: true,
    });
  });
});

describe("deriveTitle", () => {
  it("uses the first non-empty line and strips markdown", () => {
    expect(deriveTitle("\n\n## Why we ship on Fridays\n\nBody…")).toBe("Why we ship on Fridays");
  });
  it("cuts long lines at a word boundary with an ellipsis", () => {
    const t = deriveTitle("word ".repeat(60), 30);
    expect(t?.endsWith("…")).toBe(true);
    expect(t?.length).toBeLessThanOrEqual(31);
  });
  it("returns null for empty input", () => {
    expect(deriveTitle("   \n ")).toBeNull();
  });
});

describe("stripTimestamps", () => {
  it("drops timestamp-only lines and leading markers", () => {
    expect(stripTimestamps("0:00\nhello there\n[01:23] second line\n(1:02:03) - third")).toBe(
      "hello there\nsecond line\nthird",
    );
  });
});

describe("buildSource", () => {
  it("counts words, derives a title, and flags truncation", () => {
    const s = buildSource({ type: "paste", text: "# Title\n\n" + "word ".repeat(9_000) });
    expect(s.title).toBe("Title");
    expect(s.truncated).toBe(true);
    expect(s.wordCount).toBe(8_000);
    expect(s.thumbnailUrl).toBeNull();
  });
  it("strips timestamps for youtube sources only", () => {
    expect(buildSource({ type: "youtube", text: "0:00\nhi" }).text).toBe("hi");
    expect(buildSource({ type: "paste", text: "0:00\nhi" }).text).toBe("0:00\nhi");
  });
});
