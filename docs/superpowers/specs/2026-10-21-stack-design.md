# The Polyforms stack: one versioned package for every app

Date: 2026-10-21
Status: design, awaiting approval. Supersedes `dev-playbook`'s
`2026-09-19-npm-library-design.md`, which was never implemented; this project starts from zero with
Shiori as the reference.

## Intent

Shiori is the most advanced Polyforms app: CI, Terraform, Sentry, scheduled routines, App Store
delivery, API deprecation cycle, iOS architecture. Weeks of feedback shaped how it is built and how
Claude works on it, and most of that knowledge lives in one repository and in Claude's private
memory. The next app should start where Shiori is, with Claude already knowing the rules, so the
first weeks are spent adding features rather than re-explaining how to build, how to review, when to
push and what a screen must look like.

The first consumer is a rebuild of Bazar from scratch, as the test that the package delivers that
experience.

## Goals

- A new Firebase + iOS app starts with Shiori's practices in place on day one: rules, skills, hooks,
  CI workflows, Terraform, scripts.
- A rule given once, in any project, reaches every project: the package is versioned, and a
  version bump carries what to change.
- Upgrades are applied by Claude, not by hand: Renovate opens the bump, a routine reads the
  migration notes, changes the project's code, merges when safe.
- A project can decline a practice it does not use (no iOS, no paid AI), without forking the rules.

## Non-goals

- A framework or a runtime library. The package ships text, configuration and templates; the
  app's code stays in the app.
- Replacing Shiori's own documentation of its data model or product decisions: those stay in the
  project.
- A design system (the `design-system` repository is a separate product).

## Anti-goals

- A rule that names a tool absent from the machine, or an example that only works on Shiori.
- A migration that force-merges on doubt. A wrong automatic refactor across four repositories costs
  more than a pull request left open.
- Rules that drift from practice: if Shiori stops doing something, the rule changes in the same
  commit, not months later.

## Decisions

| Topic | Decision |
|---|---|
| Reference project | Shiori wins every conflict; Vinarium next; Shuhari and Bazar last. |
| Distribution | A public npm package, installed as a devDependency; the Swift components as a Swift package in the same repository, pulled by tag and tracked by Renovate's Swift manager. Name to confirm (`@moifort/stack` needs an npm organisation; `@moifort/stack` exists as a scope already). |
| Language | Everything in the package in English. Product copy rules keep their placeholders. |
| What the package holds | `rules/` (Markdown, by theme), `skills/`, `hooks/`, `templates/` (workflows, Terraform, scripts, CLAUDE.md, project-context.md), `migrations/`, `CHANGELOG.md`, a CLI. |
| How a project consumes it | `CLAUDE.md` imports `rules/` from `node_modules` with `@` lines, so a version bump changes Claude's instructions without touching the project; `sync` copies skills and hooks into `.claude/` and renders placeholders. |
| Upgrade agent | A scheduled Claude routine that reviews Renovate pull requests (to create; none exists today) guided by the `stack-upgrade` skill shipped in the package. |
| Automerge | Per migration risk: a bump merges on its own only when every migration is `safe`, applied or not applicable, and CI is green. |
| Where feedback goes | A generic correction is written into the package in the same task (commit, version bump, migration if code is affected); a project fact goes into that project's `project-context.md`; Claude's private memory keeps neither. |
| Publishing | A `vX.Y.Z` tag runs tests, content validation and `npm publish --provenance` through GitHub Actions OIDC. No token to manage. |

## Package layout

```
rules/
  00-collaboration.md   behaviour, critical review, autonomy, languages, where feedback goes
  01-workflow.md        task cycle, specs and plans, verification, screenshots after UI work
  02-commits.md         conventional commits, parallel sessions on one checkout, push only on request
  03-code-review.md     the review grid
  04-push.md            checklist, CI watched to the end and fixed forward, simulators shut down
  05-release.md         deprecations, changelog approval, tag
  06-changelog.md       two files, plain words, release time only
  07-appstore.md        toolchain, signing, captures, TestFlight, App Store Connect traps
  08-copy.md            tone, localisation model
  09-backend.md         domains, branded types, errors, flat collections, observability, tests
  10-ios.md             pure or connected, actions, clients, loading, snapshots, pagination, design conventions
  11-ops.md             migrations through CI only, no local deploy, backups, secrets, scale to zero
  12-ci.md              one workflow per concern, paths-ignore, Renovate
  13-ai.md              model choice, cost estimate before building, keys and billing
  14-infra.md           Terraform for Firebase and Cloud Functions, observer account, bootstrap
  15-tooling.md         Xcode and simulators, built-in browser, remote control
  16-routines.md        scheduled Claude tasks and what each may do
  17-landing.md         the page that sells the product: structure, copy, screens, languages
skills/                 domain, graphql, ios-feature, appstore, stack-upgrade, stack-install
routines/               scheduled Claude task prompts: sentry-autofix, daily-health, stack-upgrade
hooks/                  shutdown-simulators-after-push, and later ones
templates/              CLAUDE.md, project-context.md, .github/workflows/*, infra/*.tf, scripts/*
migrations/<version>/<id>.md
swift/PolyformsUI/      the shared SwiftUI component package (atoms, molecules, styles, catalogue app)
bin/                    the CLI
CHANGELOG.md
```

## Project layout

```
stack.config.json       stacks and placeholders, source of truth
CLAUDE.md               created from the template at install, owned by the project afterwards;
                        imports the rules with @node_modules/<package>/rules/<file>.md lines
project-context.md      the project's facts: ids, accounts, devices, certificates, pending work
.claude/skills/         copied by sync, follow the installed version
.claude/settings.json   hooks registered by sync
renovate.json           packageRule for the package: label `stack`, automerge false
```

`stack.config.json`:

```json
{
  "stacks": ["backend", "ios", "ai"],
  "placeholders": { "APP_NAME": "…", "MAIN_BRANCH": "main", "GCP_PROJECT": "…" },
  "exclude": []
}
```

Process rules (`00` to `08`, `12`, `15`, `16`) always apply; `stacks` selects the rest.

## CLI

| Command | Behaviour |
|---|---|
| `bootstrap <app>` | Creates a new project end to end: `init`, then the organisation-level Terraform root with the keychain tokens (GitHub repository, Sentry projects, Renovate, GCP project, state bucket), first commit, first push, and the numbered list of what needs the person. Replayable. |
| `init` | Asks stacks and placeholders, writes `stack.config.json`, runs `sync`, creates `CLAUDE.md` and `project-context.md` from the templates if absent, copies the templates the stacks need. |
| `sync` | Renders placeholders, copies skills and hooks, registers the hooks, renders the routines into the machine's scheduled-tasks folder, writes the installed version where `check` can read it. Idempotent; fails without writing on a missing placeholder. |
| `check` | Non-zero if the project's copy differs from `sync`'s output or a raw placeholder remains. Run in the project's CI. |
| `migrations <from> <to>` | Lists the migrations between two versions, in semver order, filtered on the project's stacks. `--json` for the routine. |

## Migrations

A migration exists whenever a rule change makes existing code non compliant. Rewording needs none.

```markdown
---
id: ios-screenshot-after-ui-change
risk: safe | review
stacks: [ios]
rule: rules/10-ios.md#screenshots
check: "<shell command, non-zero while non compliant code remains>"
---
## What changes
## How to find it
## How to fix it
## Not applicable when
```

- `risk: safe` requires a mechanical fix and a `check`; anything else is `review`.
- Idempotent: applying it to compliant code changes nothing.
- Semver: patch for rewording, minor for a new rule or domain with its migrations, major for a
  change to the package layout, the CLI or `stack.config.json`.
- `CHANGELOG.md` lists each version's migrations with their risk: it is the first thing the routine
  reads.

## Skill: stack-upgrade

Followed by the review routine on a Renovate pull request labelled `stack`.

1. Install, run `sync`, commit `chore(stack): sync to vX.Y.Z`.
2. `migrations <old> <new> --json`.
3. For each migration: read the rule, find the code, fix it, run its `check`, commit
   `refactor(<scope>): <migration id>`. Not applicable: record why, commit nothing.
4. Run the project's preflight. A failure caused by a migration reverts that commit and marks it
   `needs review`.
5. Comment on the pull request: one line per migration with its outcome and the files touched.
6. Update the scheduled tasks if the version changed a routine.
7. Merge only if every migration is `safe`, applied or not applicable, every `check` passes and CI
   is green. Otherwise label `stack:review` and leave it open.

## Skill: stack-install

1. `bun add -d <package>`, then `init`.
2. Add the Renovate package rule and `check` to CI.
3. Create or update the scheduled tasks for the rendered routines (machine-scoped ones once,
   project-scoped ones for this project).
4. Bring the project in line, one domain at a time, from the validated templates: CI workflows,
   Terraform, Sentry, scripts.
5. On an existing project, write a batched plan, one batch per domain.

## Content validation

Run in the package's CI: valid frontmatter on every migration, every `rule` anchor exists, no
`safe` migration without `check`, every placeholder documented, no em dash or en dash, no project
name or identifier (denylist kept outside the published files).

## Delivery order

1. **Rule harvest** (this is the next spec): Shiori first, then `dev-playbook`, Vinarium, Shuhari,
   Bazar and Claude's memories; conflicts resolved by the review in
   [2026-10-21-rule-harvest-review.md](2026-10-21-rule-harvest-review.md). Ships as `1.0.0` with no
   migration.
2. **Executable templates**: Shiori's workflows, Terraform, scripts, neutralised.
3. **CLI, skills, hooks, release workflow.**
4. **The Renovate review routine**, registered as a scheduled task.
5. **Bazar rebuilt from zero** on the package: the acceptance test.
6. Shiori moves to the package: `init` picks up its values, the diff on its `CLAUDE.md` must be a
   reduction to project facts and nothing else.

## Left to the builder

- Exact placeholder list, settled during the harvest.
- Whether `sync` symlinks or copies skills (copy, unless Claude Code resolves symlinks reliably).
- The CLI's language and test runner: TypeScript on Bun, `bun test`, like every Polyforms backend.
