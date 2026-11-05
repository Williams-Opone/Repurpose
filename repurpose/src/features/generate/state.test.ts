import { describe, expect, it } from "vitest";

import { failStreaming, initialStateFrom } from "./state";

const ID = "6f1c2e4a-1b2c-4d3e-9f8a-0b1c2d3e4f5a";

describe("initialStateFrom", () => {
  it("marks persisted outputs done and missing formats as errors", () => {
    const s = initialStateFrom({
      generationId: ID,
      formats: ["twitter_thread", "linkedin_post"],
      outputs: [
        {
          format: "twitter_thread",
          outputId: ID,
          content: { kind: "thread", tweets: ["a"] },
          tokensUsed: 1,
        },
      ],
    });
    expect(s.formats.twitter_thread?.status).toBe("done");
    expect(s.formats.linkedin_post?.status).toBe("error");
    expect(s.running).toBe(false);
  });
});

describe("failStreaming", () => {
  it("only touches streaming entries", () => {
    const out = failStreaming(
      { twitter_thread: { status: "streaming", partial: {} }, linkedin_post: { status: "idle" } },
      "Interrupted",
    );
    expect(out.twitter_thread).toEqual({ status: "error", message: "Interrupted" });
    expect(out.linkedin_post).toEqual({ status: "idle" });
  });
});
