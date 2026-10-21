# @polyforms/stack

How Polyforms apps are built, as one versioned package: the rules Claude follows on every
project, the skills and routines it runs, and the templates a new app starts from. A Firebase
backend in TypeScript, a SwiftUI app, Terraform, GitHub Actions, Sentry.

## Start an app

1. `mkdir <app> && cd <app> && git init`
2. `bunx @polyforms/stack init --stacks backend,ios`
3. `bun install && bun run preflight`

## Keep an app up to date

Renovate opens a pull request when a new version is published. The upgrade routine syncs the
rules into the project's `stack/` folder and applies the version's migrations, listed in
[CHANGELOG.md](CHANGELOG.md).

## What is inside

| Folder | What |
|---|---|
| `rules/` | The rules, imported by each project's `CLAUDE.md` through `stack/rules/` |
| `skills/` | The long forms, copied into `.claude/skills/` |
| `routines/` | The scheduled Claude tasks |
| `templates/` | What `init` writes into a new project, per stack |
| `migrations/` | What to change in a project when a version changes a rule |
