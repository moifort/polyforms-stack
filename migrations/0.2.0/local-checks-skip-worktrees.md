---
id: local-checks-skip-worktrees
risk: safe
stacks: [any]
rule: rules/02-commits.md#several-sessions-on-one-project
check: grep -q 'pathIgnorePatterns' bunfig.toml && grep -q '"!build"' biome.json
---

**What changes.** Worktrees of parallel sessions live under `build/` and `.claude/worktrees/`:
`bun test`, `tsc` and Biome ran their code (another branch's) as this checkout's.

**How to fix.**

1. `bunfig.toml`: add `[test]` with `pathIgnorePatterns = ["build/**", ".claude/**"]`.
2. `tsconfig.json`: add `"exclude": ["node_modules", "build", ".claude", ".output", "dist"]`.
3. `biome.json`: add `"!android"`, `"!build"`, `"!.claude"`, `"!**/.context-*"` to
   `files.includes`; add `"markdown": { "formatter": { "enabled": false } }` and the same for
   `"yaml"`; set `@biomejs/biome` to `2.6.6` in `package.json` and the `$schema` URL to match.
4. `bun run lint:fix`, then `bun run preflight`.
