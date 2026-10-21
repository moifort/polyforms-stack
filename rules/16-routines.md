# Scheduled routines

Claude tasks that run on a schedule from the development machine. Each one states its cadence,
its repositories, what it may do, and what it never does. A routine's push is the one exception to
"never push unasked" ([02-commits.md](02-commits.md#push)).

| Routine | Cadence | Does | Never |
|---|---|---|---|
| Sentry triage | Every six hours, every app | Reads unresolved issues, fixes the cause with a verified commit, pushes to `{{MAIN_BRANCH}}`, watches CI, marks `resolvedInNextRelease` | Marks plain `resolved`; touches an issue it did not fix |
| Daily health | Noon, per app | Through the observer account: spend from the billing export, performance, monitoring; fixes and pushes what is code; reports cold starts as a figure | Proposes a warm instance; reads errors (Sentry's job) |
| Stack upgrade | When Renovate opens a pull request labelled `stack` | Follows the `stack-upgrade` skill: sync, migrations one by one with their checks, preflight, comment, merge only when every migration is safe and CI is green | Force-merges on a `review` migration; edits rules |

## Rules

- A routine verifies before committing and watches CI after pushing like any session.
- A routine never asks the person anything; what it cannot settle, it leaves open with a comment
  or a report.
- A routine reads production through the observer account, never through the person's login.
- The routine's prompt lives in the machine's scheduled tasks; the skills it follows are shipped
  by this package.
