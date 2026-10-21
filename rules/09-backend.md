# Backend

A TypeScript backend on Bun and Nitro, Firebase preset, GraphQL through Apollo Server and Pothos,
native Firestore, Zod and branded types. Long form in the `domain` and `graphql` skills.

## Architecture

One folder per domain under `server/domain/{domain}/`: `types.ts`, `primitives.ts`,
`command.ts` (`XxxCommand` namespace), `query.ts` (`XxxQuery` namespace), optional
`business-rules.ts` (pure functions, full test coverage) and `use-case.ts` (orchestration across
domains, no business logic of its own), and `infrastructure/{repository.ts, graphql/}`.

- Commands change state, queries change nothing.
- The repository is bare exported functions (`import * as repository`), private to its domain. A
  domain that needs another goes through that domain's `Query` or `Command`, never its storage.
- A function's name carries the business concept, never the technical pattern: `versionToOpen`,
  not `computeVersion` or `handleX`. One concept, one word, at every layer: domain, schema, app,
  tests.
- Functional style: no class, no object interface. Polymorphism is a discriminated union on a
  literal field; on the API side a union, never an interface.

## Types

No bare primitive in a domain model: every field carries a branded type (`ts-brand`) with its
validating Zod constructor in `primitives.ts` and one GraphQL scalar per brand, which reuses the
constructor rather than restating the rule. Generic brands (user id, amount, year, percentage)
live in the shared domain. Dates stay native. Validation happens once, at the boundary, at
construction: the rest of the code works on valid values. Never `as MyType` on untrusted input.

No `null` in the domain: absence is an optional field, converted only at the API and storage
boundaries.

## Errors

A command returns the domain value or a bare string-literal outcome (`'not-found' as const`), one
distinct literal per expected failure. The resolver maps them exhaustively with
`match().exhaustive()` and the `notFound` / `badUserInput` helpers; a new outcome that is not
mapped fails to compile. `throw` only for an impossible state. If the caller can do nothing with
an absence, it is an inconsistent state, throw; if it is a normal scenario, return the outcome.

## Storage

Native Firestore through `db()`, only inside `infrastructure/repository.ts`, with the shared
helpers (converter, transactional read-modify-write, bulk save, delete in batches, per-request
memoisation).

- **Collections are flat.** Never a subcollection: every document sits in a top-level collection
  and names its owner in a `userId` field. Accounts live in `users/{userId}`. Every query filters
  on `userId`.
- A shared document (a catalogue two users converge on) holds no reference to any user and is
  keyed deterministically by what identifies it, so the paid call that produced it is paid once.
- **Pay the migration before the feature.** Adding a boolean to production records costs a
  migration: a field a certain upcoming feature needs is added now, with its default.
- Filtering, sorting and pagination happen in Firestore, never in memory after loading all.
- Multiple writes go through one batch; mass deletions through successive batches.

## Reads and cost

No nested field triggers one read per parent row. Either a per-request loader groups the reads by
parent id, or the data is denormalised on purpose (a book carries its series name and volume, so
sectioning a library reads no catalogue document). When a nested field needs the catalogue, add a
loader before shipping it. The only server-side cache is per incoming request: a domain query
called several times during one call reads once.

## Observability

Never `console.*`. One logger per component, `createLogger(tag)`. Every `warn` and `error` is
reported to Sentry, so a caught-and-recovered failure is logged, never swallowed. Keep the message
constant and pass the rest apart (`logger.warn('cover lookup failed', { error, isbn13 })`), so
Sentry groups one problem into one issue and keeps the stack. Sentry activates only in a built
bundle with its DSN set, never in local development. The logger's extras appear under `.context`
in the event.

## Tests

Three suffixes, three CI workflows, co-located with the code:

| Suffix | Scope |
|---|---|
| `*.unit.test.ts` | Primitives and business rules, pure functions |
| `*.int.test.ts` | Commands and queries against the in-memory fake Firestore |
| `*.feat.test.ts` | Business scenarios through the built GraphQL schema: error codes, gates, read budgets |

- Storage is mocked with `mock.module('~/system/firebase', () => ({ db: fakeDb }))`. The fake
  has no subcollections, matching the flat layout.
- Read budgets are asserted with the split counters `docReads` and `queryReads`, never the total.
- The per-request memoisation is active inside a test and reset between tests: reseeding between
  two calls of the same query in one test returns the stale result. Use two tests.
- Under Bun, `toMatchObject({ at: someDate })` matches any Date: assert a date with `toEqual` on
  the field.
- The three families run separately before a commit ([01-workflow.md](01-workflow.md)).

## Generated code

An exported schema, a typed client, a compiled asset belong to their generator: never edited by
hand, regenerated, committed when the repository needs them, excluded from the linter.

## Local development

A dev-only auth bypass (`DEV_USER_ID`) lets the schema explorer work without a token, and a
stub answers paid calls with a fixed result; both are `import.meta.dev` gated and tree-shaken out
of a production bundle. A dev server on real data runs real mutations. `.env.example` is updated
with every new variable, in the same commit.
