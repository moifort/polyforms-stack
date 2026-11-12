---
id: no-warm-instance
risk: safe
stacks: [backend]
rule: rules/11-ops.md#scale-to-zero
check: bun scripts/check-rules.ts warm-instance
---

**What changes.** `bun run rules:check` refuses `min_instance_count` above zero in `infra/` and
`minInstances` above zero in `nitro.config.ts`.

**How to fix.** Set `min_instance_count = 0` (or remove the line) in `infra/function.tf`, and
remove `minInstances` from `httpsOptions` in `nitro.config.ts`. The next deploy scales the
function to zero; a slow p95 is reported, not fixed with a warm instance.
