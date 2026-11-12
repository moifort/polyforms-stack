---
id: request-cache-scopes
risk: review
stacks: [backend]
rule: rules/09-backend.md#reads-and-cost
check: grep -q 'AsyncLocalStorage' server/system/request-cache.ts
---

**What changes.** `withRequestCacheScope` used to swap the cache on the request event, so two
scopes running side by side (a nightly pass over several accounts at once) read and overwrote
each other's. The scope now follows the async flow (`AsyncLocalStorage`). The template also gains
`memoizedManyPerRequest` (documents read together, each memoized from the moment it is asked),
`server/utils/nightly-pass.ts` (a nightly pass over accounts, a few at a time, within a time
budget) and `>` / `<` in the fake Firestore.

**How to fix.** Replace `server/system/request-cache.ts` and its unit test with the template's,
copy `server/utils/nightly-pass.ts` and its test if the project has nightly passes, and replace
`server/test/fake-firestore.ts` when the project did not change its own. Run the three test
families.

**Does not apply** when the project has no `withRequestCacheScope` caller and no nightly pass;
the file can still be replaced.
