import { assertNever } from "@/lib/utils";
import type { Format, OutputContent } from "@/types";

import { instagramCaption } from "./instagram-caption";
import { linkedinPost } from "./linkedin-post";
import { newsletterSection } from "./newsletter";
import { twitterThread } from "./twitter-thread";
import type { FormatModule } from "./types";
import { youtubeDescription } from "./youtube-description";

export const FORMAT_REGISTRY: Record<Format, FormatModule> = {
  twitter_thread: twitterThread,
  linkedin_post: linkedinPost,
  newsletter_section: newsletterSection,
  instagram_caption: instagramCaption,
  youtube_description: youtubeDescription,
};

/** What gets copied to the clipboard, formatted for the platform. */
export function outputToPlainText(c: OutputContent): string {
  switch (c.kind) {
    case "thread":
      return c.tweets.join("\n\n");
    case "post":
    case "description":
      return c.body;
    case "newsletter":
      return `${c.subject}\n\n${c.body}`;
    case "caption":
      return c.hashtags.length
        ? `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}`
        : c.body;
    default:
      return assertNever(c);
  }
}

export { FormatValidationError, type FormatModule } from "./types";
