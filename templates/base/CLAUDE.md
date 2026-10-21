# {{APP_NAME}}

<!-- stack:rules -->
<!-- /stack:rules -->

What the app is, in two sentences, for someone who has never opened it.

The rules above are the Polyforms stack, version `{{STACK_VERSION}}` (`stack/VERSION`), and
this file holds only what is specific to this project. The project's facts (ids, accounts,
devices, certificates, pending work) are in [project-context.md](project-context.md).

## Commands

| Purpose | Command |
|---|---|
| Typecheck | `bun run typecheck` |
| Tests, by family | `bun run test:unit`, `bun run test:int`, `bun run test:feat` |
| Preflight (all of the above plus lint) | `bun run preflight` |
| Linter | `bun run lint` / `bun run lint:fix` |
| GraphQL schema | `bun run generate:graphql` |
| Schema compatibility | `bun run schema:check` |
| Deprecations | `bun run deprecations` |
| Dev server | `bun run dev` |
| Stack in sync | `bun run stack:check` |

## Data model

What is private and what is shared, the collections and their keys, the invariants a
reviewer must know before touching a domain. Written once the first domain exists.

## Traps of this project

One line per trap, with the symptom and the way around it. Anything that would hold in
another project goes into the stack instead of here.
