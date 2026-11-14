---
id: repository-conventions
risk: review
stacks: [backend]
rule: rules/09-backend.md#storage
check: "! grep -rqE '\\| null>' server/domain --include=repository.ts && ! grep -rqE \"from '\\.\\.?/\" server/domain"
---

**What changes.** Three conventions every repository follows, stated in the rule:

- an absent document is `undefined`, what `.data()` gives, never `null`, through the
  repositories, commands, queries and use cases; `null` only at the GraphQL boundary;
- functions are `find…`, `save…`, `remove…`, unless the name carries a business concept;
- imports go through the `~/` alias, never `../` or `./`.

**How to fix.**

1. In each repository, drop `?? null` after `.data()` and answer `T | undefined`. Run
   `bunx tsc --noEmit`: it lists every caller typed with `| null`, every `=== null` and every
   `?? null` that follows. Change them to `undefined` down to the resolvers; a `match` on
   `null` becomes one on `undefined`. Leave computed values (a state, a cursor) and the JSON
   schemas of a model call alone.
2. Tests: `toBeNull()` on what a query, a command or a use case answers becomes
   `toBeUndefined()`. `fake.data(...)` keeps answering `null`.
3. Rename the repository functions named otherwise (`deleteX`, `allX`, `removeAllForUser`) and
   their callers.
4. Rewrite each relative import under `server/domain` with its `~/` path, then
   `bunx biome check --write` on the files changed.

**Does not apply** when the check passes.
