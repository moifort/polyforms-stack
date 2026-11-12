---
id: check-rules-script
risk: safe
stacks: [backend]
rule: rules/12-ci.md#stack-checks
check: test -f scripts/check-rules.ts && grep -Eq '"preflight": ".*rules:check' package.json && grep -q 'rules:check' .github/workflows/test-unit.yml
---

**What changes.** Three rules a search settles are checked instead of re-read: flat collections,
no warm instance, no derived data path under `/tmp`. `scripts/check-rules.ts` runs them in the
preflight and in the `unit` job.

**How to fix**, from `node_modules/@moifort/stack/templates/backend/`:

1. Copy `scripts/check-rules.ts`.
2. `package.json`: add the script `"rules:check": "bun scripts/check-rules.ts"`, and in
   `preflight` add `&& bun run rules:check` before `&& bun run stack:check`.
3. `.github/workflows/test-unit.yml`, job `unit`: a step `- run: bun run rules:check` after the
   `bunx stack check` step.
4. `bun run rules:check`. A failing check is fixed by its own migration of this version
   (`flat-collections`, `no-warm-instance`) or, for `derived-data`, as the 0.2.0 migration
   `derived-data-reuse` says.
