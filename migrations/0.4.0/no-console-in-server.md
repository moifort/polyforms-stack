---
id: no-console-in-server
risk: review
stacks: [backend]
rule: rules/09-backend.md#observability
check: grep -q noConsole biome.json && bunx biome check server
---

**What changes.** Biome refuses `console.*` under `server/`, tests excepted (`server/test/`,
`*.test.ts`): a line written with `console` reaches neither the structured log nor Sentry.

**How to fix.**

1. `biome.json`: copy the `overrides` block of `node_modules/@moifort/stack/templates/base/biome.json`
   (the `noConsole` rule on `server/**`, `!server/test/**`, `!**/*.test.ts`), next to `linter`.
2. `bunx biome check server` lists each call. Replace it with the component's
   `createLogger(tag)`, at the level its meaning says: `error` and `warn` go to Sentry, `info`
   does not. A constant message, the values passed apart (`logger.info('cache miss', { key })`).
3. Review the levels chosen: a `console.error` that was an expected failure becomes `info`, or
   it opens a Sentry issue nobody can fix.
