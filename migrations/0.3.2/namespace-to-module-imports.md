---
id: namespace-to-module-imports
risk: review
stacks: [backend]
rule: rules/09-backend.md#architecture
check: "! grep -rEn '^(export )?namespace ' server scripts --include='*.ts' --exclude='*.d.ts'"
---

**What changes.** A domain module exports bare functions and its caller imports the module under
the domain's name (`import * as BookCommand from '~/domain/book/command'`). Projects started
before the package wrap the same functions in `export namespace BookCommand { … }` and import
the namespace by name. The call sites read the same either way (`BookCommand.rate(...)`); only
the declaration and the import line move.

**How to find it.** `grep -rEln '^(export )?namespace ' server scripts --include='*.ts'` lists
the files: `command.ts`, `query.ts`, `use-case.ts`, and the infrastructure clients that wrap a
third party the same way.

**How to fix**, one domain per commit, so a red test names its domain:

1. In the file, remove the `export namespace Name {` line and its closing brace, and unindent
   the body. Every `export` inside stays an `export`; a member that was not exported becomes a
   private constant of the module. A member that called a sibling as `Name.other(...)` calls
   `other(...)`.
2. A name now at the top of the module may collide with an import of the same file (a member
   `rate` beside `import { rate } from …`): rename the import, never the exported member, whose
   name is the business word.
3. A file holding two namespaces becomes two files, each named after what it exports.
4. Every importer, found with
   `grep -rnw 'Name' server scripts --include='*.ts' | grep import`:
   - `import { Name } from '<path>'` becomes `import * as Name from '<path>'`;
   - a mixed line (`import { Name, type Other } from '<path>'`) becomes two lines: the
     `import * as Name` and an `import type { Other }`;
   - in tests, `const { Name } = await import('<path>')` becomes
     `const Name = await import('<path>')`;
   - a `mock.module('<path>', () => ({ Name: { rate } }))` factory returns the functions at
     the top level: `() => ({ rate })`.
5. Once no namespace is left, add `"style": { "noNamespace": "error" }` to the linter rules of
   `biome.json`, as the template has it, so none comes back.
6. `bun run typecheck`, the three test families separately, `bun run lint`. The exported GraphQL
   schema must not move: `bun run generate:graphql` leaves `shared/schema.graphql` unchanged.

**Does not apply** to a project generated from the templates: its modules are already bare.
An ambient `declare namespace` in a `.d.ts` file is not concerned.
