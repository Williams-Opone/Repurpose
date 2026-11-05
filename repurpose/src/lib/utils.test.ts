import { describe, expect, it } from "vitest";
import { cn, countWords, formatRelativeTime } from "./utils";

describe("cn", () => {
  it("merges tailwind classes with last-wins semantics", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe("text-sm font-medium");
  });
});

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("  hello   world\nfoo ")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2025-01-01T12:00:00Z").getTime();
  it("formats past times", () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5 minutes ago");
    expect(formatRelativeTime(now - 26 * 3_600_000, now)).toBe("yesterday");
  });
});
