import "server-only";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

import { MAX_ARTICLE_BYTES, REMOTE_FETCH_TIMEOUT_MS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { buildSource } from "./normalize";
import type { Source } from "./types";

const MAX_REDIRECTS = 5;
const USER_AGENT = "Mozilla/5.0 (compatible; Repurpose/1.0; +https://github.com)";

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
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  if (h.includes(":")) {
    // IPv6: loopback, unique-local (fc00::/7), link-local (fe80::/10), v4-mapped
    return (
      h === "::1" ||
      h === "::" ||
      /^f[cd]/.test(h) ||
      /^fe[89ab]/.test(h) ||
      h.startsWith("::ffff:")
    );
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

/** Follows redirects manually so every hop is re-validated against the SSRF guard. */
async function fetchPublic(url: string, hops = 0): Promise<Response> {
  const target = assertPublicHttpUrl(url);

  let res: Response;
  try {
    res = await fetch(target, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    throw new AppError(
      "PROVIDER_ERROR",
      "That page took too long to respond. Paste the text instead.",
      {
        cause: e,
      },
    );
  }

  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const location = res.headers.get("location");
    if (!location || hops >= MAX_REDIRECTS) {
      throw new AppError("INVALID_INPUT", "That link redirects too many times.");
    }
    return fetchPublic(new URL(location, target).toString(), hops + 1);
  }
  return res;
}

/* ---------- Extraction ---------- */

export async function fetchArticleSource(url: string): Promise<Source> {
  const res = await fetchPublic(url);

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
  const dom = new JSDOM(html, { url: res.url || url });
  try {
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent?.trim()) {
      throw new AppError(
        "INVALID_INPUT",
        "We couldn't find the main article text on that page. Paste it instead.",
      );
    }

    const hostname = new URL(res.url || url).hostname.replace(/^www\./, "");
    const source = buildSource({
      type: "url",
      text: article.textContent,
      title: article.title,
      url: res.url || url,
      author: article.byline ?? article.siteName ?? hostname,
    });

    logger.info("article source fetched", { hostname, wordCount: source.wordCount });
    return source;
  } finally {
    dom.window.close();
  }
}
