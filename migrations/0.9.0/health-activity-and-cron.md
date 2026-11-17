---
id: health-activity-and-cron
risk: review
stacks: [any]
rule: routines/daily-health.md#2b-user-activity
---

**What changes.** The daily health routine (`routines/daily-health.md`) now reports user activity
(section 2b: users and new users from `admin-metrics/current`, analytics sessions per day,
requests, devices, builds and 5xx per day over 8 days, content added in 24 hours and 7 days, the
trend) and reviews every Cloud Scheduler job on its own (schedule, state, last attempt, its runs
over 8 days from the `Google-Cloud-Scheduler` request logs), with a table of every job in the
report.

**How to fix.** `stack sync` refreshes `stack/routines/daily-health.md`. The routine that actually
runs may carry its own copy: a runbook in the repository (`docs/daily-health.md`), or the prompt of
the scheduled task (`~/.claude/scheduled-tasks/<id>/SKILL.md`, or a task file on another host).

1. Find the copy that runs, and compare it with `stack/routines/daily-health.md`.
2. Add the user activity section, with the project's real names: the app's main content
   collection and its creation date field (read them in `server/domain`), and the commands the project's runbook uses for the Firestore REST API.
3. Replace the one-line scheduler check with the per-job review and its 8-day runs.
4. Add Activity and the scheduler table to the report.

**Check.** The running copy names `admin-metrics/current` and `Google-Cloud-Scheduler`:
`grep -c "admin-metrics/current\|Google-Cloud-Scheduler" <running copy>` answers 2 or more. Then
run the routine once by hand and read its report.
