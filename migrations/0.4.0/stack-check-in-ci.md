---
id: stack-check-in-ci
risk: safe
stacks: [backend]
rule: rules/12-ci.md#stack-checks
check: grep -q 'stack check' .github/workflows/test-unit.yml && grep -Eq '"preflight": ".*stack:check' package.json
---

**What changes.** `bunx stack check` ran in no workflow: a file under `stack/` edited by hand, or
a package bumped without `sync`, went unnoticed. It now runs in the preflight and in CI.

**How to fix.**

1. `package.json`: the `preflight` script ends with `&& bun run stack:check` (the
   `stack:check` script, `bunx stack check`, is already there; add it if the project lacks it).
2. `.github/workflows/test-unit.yml`, job `unit`: a step `- run: bunx stack check` right after
   the `bunx biome check` step.
3. `bun run stack:check` answers `in sync with <version>`. A difference it lists is fixed by
   `bunx stack sync`, never by editing the file; a local change to a rule is reported to the
   package instead.

**Does not apply** to a project without the backend template's `package.json`: run
`bunx stack check` in its own preflight by hand.
