import "server-only";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

import { MAX_ARTICLE_BYTES, REMOTE_FETCH_TIMEOUT_MS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { buildSource } from "./normalize";
import type { Source } from "./types";

const MAX_REDIRECTS = 10;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

// Browser-like headers: many hosts bounce bot UAs through endless challenge redirects.
const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
} as const;

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

/* ---------- SSRF guard ---------- */

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }
  if (h.includes(":")) {
    // IPv6: loopback, unique-local (fc00::/7), link-local (fe80::/10), v4-mapped
    return h === "::1" || h === "::" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith("::ffff:");
  }
  return PRIVATE_V4.some((re) => re.test(h));
}

function assertPublicHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new AppError("INVALID_INPUT", "That link doesn't look right.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new AppError("INVALID_INPUT", "Only http and https links are supported.");
  }
  if (isPrivateHost(u.hostname)) {
    throw new AppError("INVALID_INPUT", "That address isn't reachable from here.");
  }
  return u;
}

/* ---------- Minimal cookie jar (one import, one host at a time) ---------- */

class CookieJar {
  private readonly byHost = new Map<string, Map<string, string>>();

  absorb(host: string, res: Response) {
    const jar = this.byHost.get(host) ?? new Map<string, string>();
    for (const raw of res.headers.getSetCookie()) {
      const pair = raw.split(";", 1)[0] ?? "";
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    this.byHost.set(host, jar);
  }

  header(host: string): string | undefined {
    const jar = this.byHost.get(host);
    if (!jar?.size) return undefined;
    return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

/* ---------- Guarded fetch ---------- */

async function readTextCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (received >= maxBytes) {
      await reader.cancel();
      break;
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

type Fetched = { res: Response; finalUrl: string };

/**
 * Follows redirects manually so EVERY hop is re-validated against the SSRF guard.
 * Carries cookies within the same host (cookie-gated redirects are the #1 cause of
 * "too many redirects" for cookie-less clients) and detects loops early.
 */
async function fetchPublic(startUrl: string): Promise<Fetched> {
  const jar = new CookieJar();
  const visited = new Set<string>();
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = assertPublicHttpUrl(current);
    const key = target.toString();

    if (visited.has(key)) {
      throw new AppError(
        "INVALID_INPUT",
        "That site kept redirecting us in a loop — it probably needs a real browser. Paste the text instead.",
      );
    }
    visited.add(key);

    const cookie = jar.header(target.hostname);
    let res: Response;
    try {
      res = await fetch(target, {
        redirect: "manual",
        headers: cookie ? { ...BROWSER_HEADERS, cookie } : BROWSER_HEADERS,
        signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "TimeoutError";
      throw new AppError(
        "PROVIDER_ERROR",
        timedOut
          ? "That page took too long to respond. Paste the text instead."
          : "We couldn't reach that site. Check the link, or paste the text instead.",
        { cause: e },
      );
    }

    jar.absorb(target.hostname, res);

    // Node returns the real 3xx in manual mode; status 0 / opaqueredirect is a defensive branch.
    const isRedirect = REDIRECT_STATUSES.has(res.status) || res.type === "opaqueredirect";
    if (!isRedirect) return { res, finalUrl: key };

    const location = res.headers.get("location");
    if (!location) {
      throw new AppError("INVALID_INPUT", "That site redirected us nowhere. Paste the text instead.");
    }
    const next = new URL(location, target).toString();
    logger.debug("article fetch: redirect", { hop, status: res.status, from: key, to: next });
    current = next;
  }

  throw new AppError(
    "INVALID_INPUT",
    `That link redirected more than ${MAX_REDIRECTS} times. Paste the text instead.`,
  );
}

/* ---------- Extraction ---------- */

export async function fetchArticleSource(url: string): Promise<Source> {
  const { res, finalUrl } = await fetchPublic(url);

  if (!res.ok) {
    throw new AppError(
      res.status === 404 ? "NOT_FOUND" : "INVALID_INPUT",
      res.status === 404
        ? "That page doesn't exist (404)."
        : `That site refused the request (${res.status}). Paste the text instead.`,
    );
  }
  if (!(res.headers.get("content-type") ?? "").includes("html")) {
    throw new AppError("INVALID_INPUT", "That link isn't a web page. Paste the text instead.");
  }

  const html = await readTextCapped(res, MAX_ARTICLE_BYTES);
  const dom = new JSDOM(html, { url: finalUrl });
  try {
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent?.trim()) {
      throw new AppError(
        "INVALID_INPUT",
        "We couldn't find the main article text on that page. Paste it instead.",
      );
    }

    const hostname = new URL(finalUrl).hostname.replace(/^www\./, "");
    const source = buildSource({
      type: "url",
      text: article.textContent,
      title: article.title,
      url: finalUrl,
      author: article.byline ?? article.siteName ?? hostname,
    });

    logger.info("article source fetched", { hostname, wordCount: source.wordCount });
    return source;
  } finally {
    dom.window.close();
  }
}