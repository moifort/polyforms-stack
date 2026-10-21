---
id: sentry-autofix
scope: machine
cadence: "0 */6 * * *"
title: Sentry autofix (every 6 hours)
---

Fix the unresolved Sentry errors of every project of the organisation, push each fix to main, check
CI, and write a report in the person's language. This routine runs every six hours.

## Standing authorisation
The person authorised this routine to commit AND push its fixes directly to `main` without asking.
Every other rule of each project's `CLAUDE.md` and of the stack rules still applies: language,
commit style, changelog never touched, verification before commit, deprecate rather than remove an
API field, deploy only through CI, never terraform or migrate from the machine.

## Overlap guard (first)
- If `/tmp/sentry-autofix.lock` exists and is less than 5 hours old, a previous pass is running:
  stop and report it. Otherwise touch it, and delete it at the very end, also on an early stop.
- Remove any `/tmp/sentry-fix-*` directory older than 5 hours (`git worktree remove --force` for a
  worktree, `rm -rf` for a clone), then `git worktree prune` in every local checkout found below.

## Sentry access
- Org `{{SENTRY_ORG}}`, API `https://sentry.io/api/0/`.
- Token: `SENTRY_AUTH_TOKEN` from the project's `.env` if present, else from
  `{{SENTRY_TOKEN_FALLBACK_ENV}}`. Never print it, never write it into a file or a commit. A token
  that can read but not resolve is noted in the report, not retried.
- Logger extras appear under `.context` in the event JSON.

## Project discovery (no fixed list)
1. `GET /organizations/{{SENTRY_ORG}}/projects/` gives the slugs; a slug is `<name>-<platform>`
   and the GitHub repository is `{{GITHUB_OWNER}}/<name>`.
2. Local checkout: the directory under `{{CODE_DIR}}` whose `origin` points at that repository
   (scan `git remote get-url origin`, never guess from the name).
3. No checkout but `gh repo view` succeeds: clone into `/tmp/sentry-fix-<name>-<date-hour>` and
   work there as in a worktree, fresh at every pass, removed at the end.
4. Neither: list the project as unmapped and skip it.

## Steps
1. Per project: `GET /projects/{{SENTRY_ORG}}/{slug}/issues/?query=is:unresolved&statsPeriod=14d&sort=freq`.
   Keep issues with events in the last 7 days. Skip external or transient causes (timeouts,
   third-party 5xx, user cancellations) unless the code handles them wrongly.
2. Skip issues already fixed: after `git fetch origin`,
   `git log origin/main --since="14 days ago" --grep="Fixes <SHORT-ID>"`; if found, retry the
   resolve step only. A regression (`isRegression`) means the fix was wrong: investigate again.
3. Fetch the latest event (stack, message, `.context`, tags, release). Find the root cause in the
   code. Without a confident root cause, do not guess: report "to investigate" with findings.
4. Work in a worktree: `git worktree add /tmp/sentry-fix-<repo>-<date-hour> origin/main --detach`,
   install dependencies, follow that project's `CLAUDE.md` and the stack rules.
5. Fix with a regression test where the code is testable (test first). One commit per issue or
   shared root cause, minimal.
6. Verify as the rules prescribe (typecheck, the three test families separately, linter, schema
   check if the schema changed, an app build for app changes). Never commit a failing fix.
7. Commit: conventional commit, English, body with the root cause, trailer `Fixes <SHORT-ID>`,
   then the `Co-Authored-By` trailer. Never touch the changelogs.
8. Push: `git fetch origin && git rebase origin/main`, then `git push origin HEAD:main`. A
   conflicting rebase is aborted and reported, never forced.
9. Watch CI for the pushed commit (`gh run list --json databaseId,headSha,name,status,conclusion`
   filtered on `headSha`, then `gh run watch <id> --exit-status`). On failure, fix forward if the
   cause is clear, otherwise revert, push the revert, report.
10. Once CI is green, Deploy included: `PUT /organizations/{{SENTRY_ORG}}/issues/{id}/` with
    `{"status":"resolvedInNextRelease"}`, never plain `resolved`.
11. Remove the worktree, delete the lock.

## Limits
- At most 3 fixes per pass, prioritised by event count times users affected.
- Never change infrastructure, secrets, CI workflows or migrations to silence an error; never
  lower a log level to hide a bug; never delete data; never ignore an issue.

## Report (short, scannable)
Nothing found and nothing fixed: one line, plus any access problem. Otherwise per project: issues
examined, fixed (short id, root cause in one sentence, SHA, CI status, resolved or not), skipped
(reason), to investigate (leads). Access problems at the end.
