<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENTS.md — Repurpose

You are working in a production SaaS codebase. Read this fully before editing.
Depth lives in `ARCHITECTURE.md` (system design) and `DESIGN.md` (visual + motion system).

## Project

Repurpose turns one piece of content into platform-specific posts (Twitter/X thread,
LinkedIn, newsletter, etc.) in the user's own brand voice. Next.js 16 App Router,
TypeScript strict, Tailwind v4, Motion, Drizzle + Neon Postgres, Clerk, Stripe,
Vercel AI SDK + Anthropic, Upstash Redis. Package manager is **pnpm**. React Compiler is ON.

## Commands

- `pnpm dev` — dev server (Turbopack)
- `pnpm typecheck` — `tsc --noEmit`; must pass before any PR
- `pnpm lint` / `pnpm lint:fix`
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright (uses mocked AI provider via `AI_PROVIDER=mock`)
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` — Drizzle
- Run `pnpm typecheck && pnpm lint && pnpm test` before declaring any task done.

## Layout (feature-based — respect it)

- `src/app/**` — routes ONLY. Pages are thin: fetch via `features/*/queries.ts`, render components.
- `src/features/<name>/` — `actions.ts` (server actions), `queries.ts` (reads), `schema.ts` (Zod),
  `components/`. Cross-feature imports go through the feature's `index.ts`.
- `src/components/ui/` — shadcn primitives (customized). Do not add raw shadcn without theming.
- `src/components/motion/` — the ONLY place animation primitives are defined.
- `src/db/schema.ts` — single source of truth for types. Derive, don't redeclare.
- `src/lib/` — env, ai client, redis, safe-action wrapper, utils.

## Feature pattern (reference implementation: src/features/voice)

- `index.ts` exports the SERVER API (queries, actions, schema, pure helpers). Never import it from a
  client component — queries pull in `server-only`. Client code imports `./schema` and sibling components.
- Streaming AI → route handler returning `toTextStreamResponse()` + `useObject` on the client.
  Non-streaming mutations → `authedAction`. Route handlers shape errors with `errorResponse()`.
- Every query takes `userId` and filters by it. Ownership failures throw `AppError("NOT_FOUND")`,
  never FORBIDDEN — don't leak that another user's id exists.
- Validate route params (`z.uuid()`) before they reach Postgres.
- Models come only from `getModel()` in `src/lib/ai.ts`. Features never import a provider SDK.
  Every task's system prompt contains a stable marker phrase so `ai-mock.ts` can pick a fixture.
- Cross-feature: server code imports another feature's `index.ts`; client-safe code (schema, types,
  pure helpers) is imported by path, e.g. `@/features/ingest/schema`.

## Non-negotiable rules

1. **Types flow from the DB schema outward.** Use `InferSelectModel` / Zod `z.infer`.
   Never `any`, never `as unknown as`, never `// @ts-ignore`. `noUncheckedIndexedAccess` is on — handle `undefined`.
2. **Validate every boundary** with Zod: form input, server action input, AI output, webhooks, env.
3. **All mutations go through `authedAction()`** in `src/lib/safe-action.ts`. Never write a bare
   server action. Every DB query that touches user data includes `where(eq(table.userId, userId))`.
4. **AI calls return structured output.** Use `generateObject` / `streamObject` with a Zod schema from
   `features/generate/prompts/formats/*`. Never parse free text with regex. Never put source content in
   the system prompt — it is untrusted data, wrapped in delimiters in the user message.
5. **Quota is enforced server-side** in the generate route via `getEntitlements()`. Client checks are UX only.
   Failed generations must refund quota.
6. **Stripe webhooks are idempotent** (check `processed_events` by `event.id`) and signature-verified with the raw body.
7. **No manual memoization.** React Compiler handles it. Do not add `useMemo`/`useCallback`/`React.memo`.
   If a component breaks under the compiler, add `"use no memo"` to that file and leave a comment why.
8. **Server Components by default.** Add `"use client"` only for interactivity, and push it to the leaf.
9. **Secrets never reach the client.** Only `NEXT_PUBLIC_*` vars in client code. `src/lib/env.ts` is the
   only place `process.env` is read.
10. Content enters the system ONLY as a `Source` from `features/ingest` (`buildSource` for text,
    `fetchSource` for links). Nothing downstream accepts raw strings or URLs.
11. Never `fetch()` a user-supplied URL directly. `features/ingest/url.ts#fetchPublic` is the only
    outbound fetcher: private hosts blocked, redirects validated per hop, body capped, timeout set.
12. Provider errors never reach the UI. Map them to specific human `AppError` messages inside the
    feature (see `youtube.ts#mapSupadataError`).
20. Destructive actions use soft delete + an Undo toast, never a confirm dialog and never a
    server-side timer. Every list query filters `isNull(deletedAt)`.
## Motion & design rules

- Import springs and variants from `src/components/motion/motion.config.ts`. **Never hardcode a duration,
  easing, or spring in a component.** If you need a new preset, add it there.
- Use `<FadeIn>`, `<StaggerContainer>`, `<PageTransition>` etc. from `components/motion`. Do not
  write `motion.div` with inline transitions in feature components.
- Animate `transform` and `opacity` only. Never animate `width`/`height`/`top`/`left`.
- Every animation must respect `useReducedMotion()` (the primitives already do — use them).
- Hover lift ≤ 2px, scale ≤ 1.02. Enter = fade + 8px up. Exit faster than enter.
- Colors, radii, type scale come from Tailwind theme tokens. No arbitrary values like `bg-[#111]`
  unless adding a token to `globals.css` first.
- Every list/data view needs: loading skeleton (matching shape), empty state, error state.

## Style

- Named exports. One component per file. Files kebab-case, components PascalCase.
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Prefer small, reviewable diffs. Don't refactor unrelated code in the same change.
- Comments explain _why_, not _what_. No commented-out code.
- Errors: throw typed errors inside features; `authedAction` shapes them. UI shows human messages,
- UI primitives are Base UI (via shadcn). Composition uses the `render` prop, not `asChild`.
  never raw error strings.

## Testing expectations

- Any pure function (thread splitter, char limits, URL parsing, voice-block renderer, usage period key)
  gets a Vitest test in a colocated `*.test.ts`.
- Don't call real AI or Stripe in tests. Use `AI_PROVIDER=mock` and Stripe test fixtures.

## Do NOT

- Install a new dependency without stating why in the PR/commit body.
- Add a new top-level folder in `src/`.
- Use `fetch` to call our own API routes from server code — call the function directly.
- Use `localStorage` for anything that should persist across devices (voice, history, edits → DB).
- Ship a `console.log`. Use the logger in `src/lib/logger.ts`.
- Modify `src/db/migrations/*` by hand. Regenerate.

## When unsure

Read `ARCHITECTURE.md` and the nearest existing feature (`features/voice` is the reference implementation).
Match its patterns exactly. Ask before introducing a new pattern.
<!-- END:nextjs-agent-rules -->
