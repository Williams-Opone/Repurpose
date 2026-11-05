import { describe, expect, it } from "vitest";

import type { StreamEvent } from "./schema";
import { decodeEventData, encodeEvent, readSseStream } from "./stream-protocol";

const done: StreamEvent = {
  type: "done",
  format: "twitter_thread",
  outputId: "6f1c2e4a-1b2c-4d3e-9f8a-0b1c2d3e4f5a",
  content: { kind: "thread", tweets: ["a", "b"] },
  tokensUsed: 42,
};

describe("stream protocol", () => {
  it("round-trips an event through an SSE frame", () => {
    const frame = encodeEvent(done);
    expect(frame.endsWith("\n\n")).toBe(true);
    expect(decodeEventData(frame.slice("data: ".length).trim())).toEqual(done);
  });

  it("rejects malformed or unknown events", () => {
    expect(decodeEventData("not json")).toBeNull();
    expect(decodeEventData(JSON.stringify({ type: "nope" }))).toBeNull();
  });

  it("reads a chunked stream, splitting frames across chunk boundaries", async () => {
    const partial: StreamEvent = {
      type: "partial",
      format: "linkedin_post",
      payload: { body: "hi" },
    };
    const text = encodeEvent(partial) + encodeEvent(done);
    const cut = Math.floor(text.length / 2);
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(text.slice(0, cut)));
        c.enqueue(new TextEncoder().encode(text.slice(cut)));
        c.close();
      },
    });
    const seen: StreamEvent[] = [];
    await readSseStream(new Response(stream), (e) => seen.push(e));
    expect(seen).toEqual([partial, done]);
  });
});
