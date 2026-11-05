# features/generate — agent notes

## Adding a format

1. Add the key to `FORMATS` + `FORMAT_META` in `src/types/index.ts` and the stored shape to `OutputContent`.
2. Add a variant to `OutputContentSchema` in `schema.ts`.
3. Create `prompts/formats/<name>.ts` with `defineFormat()`: raw Zod schema (what the model emits),
   `instructions` starting with `### Format key: <key>`, and `finalize()` enforcing platform limits.
4. Register it in `prompts/formats/index.ts` and extend `outputToPlainText`.
5. Add a mock fixture in `src/lib/ai-mock.ts` keyed on `Format key: <key>`.
6. Generate + run a migration (the `format` pg enum changed).

## Contracts

- `finalize()` throws `FormatValidationError` for structurally-valid-but-unusable output → engine retries ONCE
  with the message fed back. Timeouts/aborts never retry.
- Source content lives only in the user message inside `<source>`; `compose.ts` neutralizes closing tags.
- Every format streams in parallel; partial success is `complete`, total failure is `failed` + refund.
- Regenerations reuse the engine with `refundOnFailure: false` and upsert the output row (edits cleared).
