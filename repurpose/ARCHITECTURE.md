# ARCHITECTURE.md — Repurpose

## Stack

Next.js 16 (App Router, RSC, Route Handlers) · TypeScript strict · React Compiler ON
Tailwind v4 + shadcn/ui (re-themed) · Motion · Tiptap
Neon Postgres + Drizzle · Clerk · Stripe · Upstash Redis
Vercel AI SDK + Google Gemini Pro · Supadata (YouTube transcripts)
Zod at every boundary · Vitest + Playwright · Sentry + PostHog · Vercel · pnpm

## Core flow

input (paste | youtube | url)
→ features/ingest: normalize → Source { type, title, text, wordCount }
→ POST /api/generate: auth → entitlements → decrement quota → insert generation
→ features/generate/engine: for each format, streamObject(schema) in parallel
→ multiplexed SSE stream: { format, type: partial | done | error, payload }
→ client hook fans events out to per-format renderers (text streams into real UI)
→ on done: postProcess → Zod validate → insert output
→ all done: generation.status = complete | any failure: failed + quota refund

## AI contract

- Every AI call returns structured JSON validated by a Zod schema. No free-text parsing.
- Voice = structured VoiceProfile (from analysis) + 2 raw samples (few-shot flavor).
- Source content is UNTRUSTED. It goes in the user message inside <source> delimiters.
  The system prompt instructs the model to treat it as data, never as instructions.
- Schema validation failure → one retry with the validation error fed back.

## Entities

users · brand_voices · voice_samples · generations · outputs · subscriptions · usage · processed_events
outputs.content = AI original (immutable). outputs.editedContent = user edits. Enables "reset to original".

## Entitlements

getEntitlements(userId) → { plan, remaining, unlimited } is the single source of truth.
Cached in Redis 60s, invalidated by Stripe webhook. Enforced server-side in the generate route.
Client-side checks are UX only.

## Dependency direction (only downward)

app → features → components | lib | db
lib → db
components and lib never import from features. features never import from app.

## Decisions log
- YouTube transcripts via Supadata (`text=true`, no timestamps); title/channel via YouTube oEmbed,
  best-effort. Thumbnails come from i.ytimg.com only — we never proxy arbitrary article images.
- Articles via Readability + jsdom on the Node runtime (`serverExternalPackages: ["jsdom"]`).
  SSRF guard: private/loopback/link-local hosts rejected, redirects followed manually with
  re-validation per hop, 2 MB body cap, 25 s timeout. Next step if this went to scale: resolve DNS
  and verify the IP too (rebinding).
- UX rule: a pasted link only triggers an import when the field is empty; typed links show an
  Import button. Pasting a link inside prose stays prose.
- 2025-xx-xx: React Compiler on → no manual memoization anywhere.
- 2025-xx-xx: Route handler (not server action) for /api/generate because we need a streamed response.
- 2025-xx-xx: Structured output per format instead of one big prompt → parallelism + per-format retry.
- Provider is selected by AI_PROVIDER (google | anthropic | mock) in src/lib/ai.ts. Default is
  Gemini 2.5 Flash for cost; one constant swaps to Pro. Free-tier privacy caveat noted for real users.
- Voice analysis streams via POST /api/voice/analyze + useObject (server actions can't stream).
  The route's onFinish persists the validated profile; the client calls router.refresh() on finish.
- AI_PROVIDER=mock swaps in MockLanguageModelV2 streaming fixtures chosen by a system-prompt marker,
  at ~human speed. UI is developed against it; CI/E2E never call a real provider.
- Voice = structured profile (reliable) + up to 2 raw samples chosen for platform diversity (flavor).
