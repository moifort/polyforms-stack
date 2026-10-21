# Scheduled routines

Claude tasks that run on a schedule from the development machine. Each one states its cadence,
its repositories, what it may do, and what it never does. A routine's push is the one exception to
"never push unasked" ([02-commits.md](02-commits.md#push)).

| Routine | Cadence | Does | Never |
|---|---|---|---|
| Sentry triage | Every six hours, every app | Reads unresolved issues, fixes the cause with a verified commit, pushes to `{{MAIN_BRANCH}}`, watches CI, marks `resolvedInNextRelease` | Marks plain `resolved`; touches an issue it did not fix |
| Daily health | Noon, per app | Through the observer account: spend from the billing export, performance, monitoring; fixes and pushes what is code; reports cold starts as a figure | Proposes a warm instance; reads errors (Sentry's job) |
| Upgrades | Every morning, after Renovate | Stack pull requests (label `stack`): the `stack-upgrade` skill, sync, migrations with their checks, merge when every migration is safe and CI is green. Major dependency pull requests: reads the changelog and migration guide, applies the code changes, deploys to staging, merges when CI and staging are green, otherwise comments and leaves open | Force-merges; edits rules; touches a pull request without one of those labels |
| Deprecations | Monthly, per app | Runs the deprecations script, removes what is removable, raises the build floor, pushes, watches CI and Deploy | Removes anything in grace or still asked; raises the floor by hand |

## Shipped by the package, installed on the machine

The routines' prompts live in `routines/` of this package, with placeholders for the project's
facts. A routine is `scope: machine` (one instance for every project: Sentry triage, stack
upgrades) or `scope: project` (one per project: daily health). `sync` renders them into
`~/.claude/scheduled-tasks/<id>/SKILL.md` (`<id>-<app>` for a project routine); the
`stack-install` and `stack-upgrade` skills then create the scheduled task when it does not exist
and update its prompt and cadence when it does, through the app's scheduled-tasks tools. A routine
is never edited by hand on the machine: the change goes into the package and reaches every machine
and project at the next version.

## Rules

- A routine verifies before committing and watches CI after pushing like any session.
- A routine never asks the person anything; what it cannot settle, it leaves open with a comment
  or a report.
- A routine reads production through the observer account, never through the person's login.
- The routine's prompt lives in the machine's scheduled tasks; the skills it follows are shipped
  by this package.
