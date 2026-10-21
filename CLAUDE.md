# @moifort/stack

The package every Polyforms app installs: rules, skills, routines, templates, CLI. The design
is [docs/superpowers/specs/2026-10-21-stack-design.md](docs/superpowers/specs/2026-10-21-stack-design.md).
The rules in `rules/` apply to work on this repository too.

## Commands

| Purpose | Command |
|---|---|
| Preflight (typecheck, lint, unit, int, content validation) | `bun run preflight` |
| Try the CLI on a scratch project | `bun bin/stack.ts init --stacks backend,ios` in an empty folder |
| Cut a version | `bun run release <x.y.z>`, then `git push origin main v<x.y.z>` |

## A version

Every change that reaches projects is a version, written in `CHANGELOG.md` first, in
English, with its four parts: **New**, **Changed**, **Fixed**, **Upgrade** (what a project
must do, each migration with its risk, or "nothing to do"). Only the parts with content.

- A rule change that makes existing code non compliant ships a migration in
  `migrations/<version>/<id>.md` and is listed under Upgrade.
- `bun run release` refuses a version without its section or without its Upgrade part, sets
  `package.json`, commits, and creates the annotated tag whose message is the section.
- Pushing the tag publishes through GitHub Actions (npm trusted publishing, no token) and
  creates the GitHub release with the same notes.
- Semver: patch for a fix or a rewording, minor for a new rule, template or migration, major
  for a change to the CLI, `stack.config.json` or the package layout.

## Checks before a version

- A template changed: generate a scratch project with the stacks it touches, and run its
  preflight (and `bun run ios:build`, `ios:test`, `ios:strings`, `ios:components` for iOS).
- `.denylist` stays outside the published files; no project identifier in `rules/`,
  `routines/`, `skills/`, `migrations/`.
