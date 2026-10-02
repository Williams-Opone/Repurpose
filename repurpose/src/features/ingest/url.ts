import "server-only";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import {
  brotliDecompressSync,
  constants as zlibConstants,
  gunzipSync,
  inflateRawSync,
  inflateSync,
} from "node:zlib";

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
  "accept-encoding": "gzip, deflate, br",
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
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  if (h.includes(":")) {
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

type Fetched = { res: Response; finalUrl: string };

/** Follows redirects manually so EVERY hop is re-validated against the SSRF guard. */
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

    const isRedirect = REDIRECT_STATUSES.has(res.status) || res.type === "opaqueredirect";
    if (!isRedirect) return { res, finalUrl: key };

    const location = res.headers.get("location");
    if (!location) {
      throw new AppError(
        "INVALID_INPUT",
        "That site redirected us nowhere. Paste the text instead.",
      );
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

/* ---------- Body handling: bytes → (decompress) → (sniff) → text ---------- */

async function readBytesCapped(res: Response, maxBytes: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
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
  return Buffer.concat(chunks);
}

const isGzip = (b: Buffer) => b.length > 2 && b[0] === 0x1f && b[1] === 0x8b;
const isZlib = (b: Buffer) =>
  b.length > 2 && b[0] === 0x78 && [0x01, 0x5e, 0x9c, 0xda].includes(b[1]!);

/**
 * Decompress by header OR magic bytes — we've seen servers gzip a body without a
 * Content-Encoding the runtime recognizes. Flush modes tolerate our capped (truncated) reads.
 */
function decompress(bytes: Buffer, encoding: string | null): Buffer {
  const enc = (encoding ?? "").toLowerCase();
  try {
    if (isGzip(bytes) || enc.includes("gzip")) {
      return gunzipSync(bytes, { finishFlush: zlibConstants.Z_SYNC_FLUSH });
    }
    if (enc.includes("br")) {
      return brotliDecompressSync(bytes, { finishFlush: zlibConstants.BROTLI_OPERATION_FLUSH });
    }
    if (isZlib(bytes) || enc.includes("deflate")) {
      try {
        return inflateSync(bytes, { finishFlush: zlibConstants.Z_SYNC_FLUSH });
      } catch {
        return inflateRawSync(bytes, { finishFlush: zlibConstants.Z_SYNC_FLUSH });
      }
    }
  } catch (e) {
    logger.warn("article fetch: decompression failed, using raw bytes", { cause: String(e) });
  }
  return bytes;
}

const BINARY_MAGICS: number[][] = [
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0xff, 0xd8, 0xff], // JPEG
  [0x47, 0x49, 0x46, 0x38], // GIF
  [0x25, 0x50, 0x44, 0x46], // PDF
  [0x50, 0x4b, 0x03, 0x04], // ZIP / docx
  [0x52, 0x49, 0x46, 0x46], // RIFF (webp, wav)
  [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // mp4
];

/** Content-type can lie or be missing; bytes don't. */
function looksBinary(bytes: Buffer): boolean {
  if (BINARY_MAGICS.some((m) => m.every((v, i) => bytes[i] === v))) return true;
  const sample = bytes.subarray(0, 4_096);
  if (sample.length === 0) return false;
  let control = 0;
  for (const b of sample) {
    if (b === 0) return true;
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) control++;
  }
  return control / sample.length > 0.1;
}

function detectCharset(contentType: string | null, bytes: Buffer): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? "")?.[1];
  if (fromHeader) return fromHeader;
  const head = bytes.subarray(0, 4_096).toString("latin1");
  const fromMeta =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ??
    /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head)?.[1];
  return fromMeta ?? "utf-8";
}

function decodeText(bytes: Buffer, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

type BodyKind = "html" | "unknown" | "other";

function classifyContentType(header: string | null): BodyKind {
  const type = (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!type) return "unknown";
  if (type === "text/html" || type === "application/xhtml+xml") return "html";
  if (type === "text/plain" || type === "application/octet-stream" || type === "text/markdown") {
    return "unknown";
  }
  return "other";
}

const HTML_SNIFF = /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<p[\s>]|<div[\s>]/i;
const looksLikeHtml = (text: string) => HTML_SNIFF.test(text.slice(0, 8_192));

/* ---------- Extraction ---------- */

export async function fetchArticleSource(url: string): Promise<Source> {
  const { res, finalUrl } = await fetchPublic(url);
  const hostname = new URL(finalUrl).hostname.replace(/^www\./, "");
  const contentType = res.headers.get("content-type");
  const contentEncoding = res.headers.get("content-encoding");

  logger.debug("article fetch: response", {
    hostname,
    status: res.status,
    contentType,
    contentEncoding,
  });

  if (!res.ok) {
    throw new AppError(
      res.status === 404 ? "NOT_FOUND" : "INVALID_INPUT",
      res.status === 404
        ? "That page doesn't exist (404)."
        : `That site refused the request (${res.status}). Paste the text instead.`,
    );
  }

  const notAPage = new AppError(
    "INVALID_INPUT",
    "That link isn't a web page. Paste the text instead.",
  );

  const kind = classifyContentType(contentType);
  if (kind === "other") throw notAPage;

  const bytes = decompress(await readBytesCapped(res, MAX_ARTICLE_BYTES), contentEncoding);
  if (looksBinary(bytes)) throw notAPage;

  const text = decodeText(bytes, detectCharset(contentType, bytes));

  // Unknown type and no HTML markup → plain-text document (raw .md/.txt links).
  if (kind === "unknown" && !looksLikeHtml(text)) {
    const source = buildSource({ type: "url", text, url: finalUrl, author: hostname });
    logger.info("plain-text source fetched", { hostname, wordCount: source.wordCount });
    return source;
  }

  const dom = new JSDOM(text, { url: finalUrl });
  try {
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent?.trim()) {
      throw new AppError(
        "INVALID_INPUT",
        "We couldn't find the main article text on that page. Paste it instead.",
      );
    }

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
