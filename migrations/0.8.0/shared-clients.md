---
id: shared-clients
risk: review
stacks: [backend]
rule: rules/09-backend.md#external-apis-and-shared-helpers
check: grep -q 'export const withoutAccents' server/utils/slug.ts && grep -q 'export const fetchJson' server/utils/fetch.ts && ! grep -rlq "normalize('NFD')" server/domain && ! grep -rq 'Math.max(1, Math.min(args.limit' server/domain
---

**What changes.** The helpers a backend wrote several times are written once: an external API
has one client under `server/system/<name>/`, accents are folded by `withoutAccents`, a GraphQL
page size is clamped by `pageSizeOf`, user secrets are sealed by `credentialsVault`, and a
nightly pass over connected accounts runs through `syncEveryConnectedReader`.

**How to fix.**

1. Copy the new pieces of the templates: `withoutAccents` and `foldedText` in
   `server/utils/slug.ts` with `slug.unit.test.ts`; `USER_AGENT` and `fetchJson` in
   `server/utils/fetch.ts`; `credentialsVault` in `server/system/secret-box.ts`;
   `NIGHTLY_BUDGET_MS` and `syncEveryConnectedReader` in `server/utils/nightly-pass.ts`;
   `server/domain/shared/graphql/pagination.ts`.
2. **`slugify` first.** It keys shared documents, so its output must not move by one character.
   Before touching it, run it over the spellings the project keys (titles, names, accented,
   punctuated, non-Latin) and put the answers in `slug.unit.test.ts` as a table; it must pass
   unchanged afterwards. `withoutAccents` drops the combining marks U+0300 to U+036F, as the
   template's `slugify` always did; a copy that used `\p{Diacritic}` also dropped spacing marks
   (`´`, `·`): keep `slugify` on `withoutAccents`, and say which comparisons moved.
3. Replace each `normalize('NFD')` folding in `server/domain` with `withoutAccents` or
   `foldedText`.
4. Replace each `Math.max(1, Math.min(args.limit ?? N, M))` with
   `pageSizeOf(args.limit, { fallback: N, ceiling: M })`.
5. For each external API called from more than one file (an AI provider, a metadata token, a
   public catalogue), move the transport into `server/system/<name>/index.ts` and leave in each
   caller its request, parsing, model, token ceiling and timeout, unchanged. Mocks of the
   callers' modules keep working; a test that stubs `fetch` keeps working too.
6. A vault per integration becomes `credentialsVault({ integration, keyName, keyOf, sealedOf,
   revived })`, its key kept apart; `openIfReadable` replaces a hand-written try/catch around
   `open`. A nightly sync that loops over connected users moves to `syncEveryConnectedReader`.
7. `bunx tsc --noEmit`, `bunx biome check`, the tests per suffix.

**Does not apply** to a project with no external API, no accent folding and no paginated list.
