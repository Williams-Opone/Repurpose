import { z } from "zod";

import { MAX_THREAD_TWEETS, TWEET_MAX_CHARS } from "@/lib/constants";

import { normalizeText, stripLeadingNumbering } from "./shared";
import { defineFormat, FormatValidationError } from "./types";

export const ThreadRawSchema = z.object({
  tweets: z
    .array(z.string())
    .describe(
      "5–9 tweets. The first is the hook. Each ≤ 260 characters. One idea per tweet. No numbering.",
    ),
});
export type ThreadRaw = z.infer<typeof ThreadRawSchema>;

function findCut(window: string): number {
  for (const sep of [". ", "! ", "? ", "\n\n", "\n"]) {
    const i = window.lastIndexOf(sep);
    if (i >= window.length * 0.4) return i + sep.trimEnd().length;
  }
  const i = window.lastIndexOf(" ");
  return i > 0 ? i : window.length;
}

/** Splits an over-long tweet at sentence → line → word boundaries until every piece fits. */
export function splitLongTweet(text: string, max = TWEET_MAX_CHARS): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= max) return [t];
  const cut = findCut(t.slice(0, max));
  const head = t.slice(0, cut).trim();
  const rest = t.slice(cut).trim();
  if (!head) return [t.slice(0, max), ...splitLongTweet(t.slice(max), max)];
  return [head, ...splitLongTweet(rest, max)];
}

export const twitterThread = defineFormat<ThreadRaw>({
  format: "twitter_thread",
  kind: "thread",
  schemaName: "TwitterThread",
  schema: ThreadRawSchema,
  instructions: `### Format key: twitter_thread
Produce an X/Twitter thread as \`tweets\`: an array of 5–9 strings.
- Tweet 1 is the hook: a specific claim, number, or tension lifted from the source. No "🧵", no "a thread", no "1/".
- One idea per tweet. Short lines. Every tweet must stand alone and be ≤ 260 characters.
- No numbering ("1/", "2/") and no "(cont.)" — the platform threads them.
- The last tweet lands the takeaway. No "follow for more", no "RT if", no engagement bait.
- Hashtags only if the author's voice uses them. Emojis only if the voice does.`,
  finalize: ({ tweets }) => {
    const clean = tweets
      .map((t) => stripLeadingNumbering(normalizeText(t)))
      .filter(Boolean)
      .flatMap((t) => splitLongTweet(t))
      .slice(0, MAX_THREAD_TWEETS);
    if (clean.length < 2) throw new FormatValidationError("Thread needs at least 2 tweets.");
    return { kind: "thread", tweets: clean };
  },
});
