const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const YT_PATH_SEGMENTS = new Set(["shorts", "live", "embed", "v"]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export type Detected =
  | { kind: "youtube"; videoId: string; url: string }
  | { kind: "url"; url: string }
  | { kind: "text" };

export type RemoteDetected = Exclude<Detected, { kind: "text" }>;

/** A single whitespace-free token that parses as an http(s) URL. Scheme is optional. */
function toUrl(input: string): URL | null {
  const t = input.trim();
  if (!t || /\s/.test(t)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function parseYouTubeUrl(input: string): string | null {
  const u = toUrl(input);
  if (!u) return null;

  const host = u.hostname.toLowerCase();
  let id: string | null | undefined;

  if (host === "youtu.be") {
    id = u.pathname.split("/")[1];
  } else if (YT_HOSTS.has(host)) {
    const [, seg, maybeId] = u.pathname.split("/");
    if (seg === "watch") id = u.searchParams.get("v");
    else if (seg && YT_PATH_SEGMENTS.has(seg)) id = maybeId;
  }

  return id && YT_ID.test(id) ? id : null;
}

export const youtubeCanonicalUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const youtubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export function detectInput(input: string): Detected {
  const videoId = parseYouTubeUrl(input);
  if (videoId) return { kind: "youtube", videoId, url: youtubeCanonicalUrl(videoId) };

  const u = toUrl(input);
  if (u && u.hostname.includes(".")) return { kind: "url", url: u.toString() };

  return { kind: "text" };
}
