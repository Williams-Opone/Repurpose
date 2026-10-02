import { describe, expect, it } from "vitest";

import { detectInput, parseYouTubeUrl } from "./detect";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeUrl", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}&t=42s`,
    `https://youtube.com/watch?feature=share&v=${ID}`,
    `https://youtu.be/${ID}?si=abc123`,
    `youtu.be/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `  https://youtu.be/${ID}  `,
  ])("extracts the id from %s", (url) => {
    expect(parseYouTubeUrl(url)).toBe(ID);
  });

  it.each([
    "https://www.youtube.com/watch?v=tooshort",
    "https://www.youtube.com/@somechannel",
    "https://vimeo.com/123456",
    `check this out https://youtu.be/${ID}`,
    "just some words",
    "",
  ])("rejects %s", (input) => {
    expect(parseYouTubeUrl(input)).toBeNull();
  });
});

describe("detectInput", () => {
  it("classifies youtube links with a canonical url", () => {
    expect(detectInput(`https://youtu.be/${ID}`)).toEqual({
      kind: "youtube",
      videoId: ID,
      url: `https://www.youtube.com/watch?v=${ID}`,
    });
  });

  it("classifies article links, adding a scheme if missing", () => {
    expect(detectInput("https://example.com/blog/post")).toEqual({
      kind: "url",
      url: "https://example.com/blog/post",
    });
    expect(detectInput("example.com/post")).toEqual({
      kind: "url",
      url: "https://example.com/post",
    });
  });

  it("treats prose, multi-line input, and bare words as text", () => {
    expect(detectInput("Here is my blog post.\n\nIt has paragraphs.").kind).toBe("text");
    expect(detectInput("Read it at https://example.com/post today").kind).toBe("text");
    expect(detectInput("hello").kind).toBe("text");
    expect(detectInput("").kind).toBe("text");
  });
});
