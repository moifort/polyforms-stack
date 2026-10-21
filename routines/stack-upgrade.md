---
id: stack-upgrade
scope: machine
cadence: "0 7 * * *"
title: Stack upgrades (daily, after Renovate)
---

Apply the stack package upgrades Renovate opened overnight, on every project of the organisation.
Report in the person's language.

## Discovery
For every repository under `{{CODE_DIR}}` whose `origin` points at `{{GITHUB_OWNER}}/*`:
`gh pr list --repo <owner>/<name> --label stack --state open --json number,title,headRefName`.
A pull request bumping `{{PACKAGE_NAME}}` is handled below; anything else labelled `stack` is
reported, not touched.

## Per pull request
1. Check out the pull request's branch in a worktree (`/tmp/stack-upgrade-<name>-<date>`),
   install dependencies, and follow the `stack-upgrade` skill shipped by the package in
   `.claude/skills/`: sync, migrations one by one with their checks, preflight, a comment on the
   pull request with one line per migration, merge only when every migration is `safe`, applied or
   not applicable, every check passes and CI is green. Otherwise label `stack:review` and leave it
   open.
2. Remove the worktree.

## Limits
- Never edit the package's rules from a consumer project; a rule that is wrong is reported.
- Never force-merge, never force-push, never touch a pull request without the `stack` label.
- At most one pull request per project per pass.

## Report
Per project: pull request, version from and to, migrations applied, not applicable, needing
review, merged or left open with the reason.
