# Operations

## Deployment goes through CI only

Never `terraform apply`, never a backend deploy, never a migration from the local machine. The
Deploy workflow on a push to `{{MAIN_BRANCH}}` is the only path to production: build, `terraform
apply`, then `POST /admin/migrate`. If production looks stale, `gh run list --workflow deploy.yml`
first; fix the pipeline, never the machine.

## Migrations

Forward-only, sequential, no rollback, in `server/system/migration/migrations/`, registered in
its index, tracked in a `migration-meta` collection, triggered by `POST /admin/migrate` from the
Deploy workflow right after `terraform apply`. After a push that adds one, read that step's log
line (`{"outcome":"migrated","from":7,"to":8,"applied":1}`) instead of telling anyone to run it.

Between the push and the end of the deploy, a local server runs new code against unmigrated data:
errors in that window are expected.

**Migrate when** renaming a field, changing its structure, changing enum values, removing stale
data. **No migration** for a new optional field, a new collection, or changed query logic. Every
migration has its `.int.test.ts`.

## Indexes

Indexes follow queries: when a query changes, add the indexes it needs and drop the dead ones.
Only the necessary: a sort done in memory after the read needs none. The index file is the source
of truth read by Terraform, not a console action.

## API evolution

The GraphQL schema is not versioned: installed builds keep asking for what they were built
against. A field or an argument the app stops using is **deprecated in the same commit**, never
removed there; `{{SCHEMA_CHECK_COMMAND}}` in CI refuses a removal not preceded by a deprecation.
At every store release, `{{DEPRECATIONS_COMMAND}}` lists what a build on sale for two weeks no
longer asks for; one commit removes it and raises the minimum supported build, which sends older
builds to the update screen. The gate fails open: if the configuration is unreachable, the app
stays usable.

| Change | What to do |
|---|---|
| Added field, query, mutation, optional input | Nothing |
| Field the app stops using | Deprecate it in the same commit |
| Removal, rename, stricter input, changed enum values | Ship backend and app together, deprecate, remove at the next release through the routine |

## Scale to zero

Never a warm instance (`min_instance_count`), whatever the p95 says. Scaling to zero is the point;
cold starts are absorbed by the launch screen, and when traffic grows the users keep instances
warm. A p95 driven by cold starts is a figure to report, not an action item.

## Monitoring and Sentry

One Sentry project per side (`<app>-node`, `<app>-ios`), org `polyforms`. Triage of an issue:

1. Load the token from the local environment, never print or commit it.
2. Read the issue and its latest event through the API.
3. Walk the stack to the domain code, fix the cause, not the symptom.
4. For a serious functional bug, write the failing test before the fix.
5. Verify locally, commit.
6. Mark the issue `resolvedInNextRelease` (never plain `resolved`, so a regression is flagged)
   only after the push **and** a green pipeline.

Source maps upload is part of the release workflow, never asked again.

## Backups and recovery

The `(default)` database has delete protection and seven-day point-in-time recovery; there is no
backup outside it. When data is lost (deleted documents, a failed migration, a deleted database or
project) follow the project's `docs/data-recovery.md` before acting, and never restore the whole
database over live writes.

## Secrets

A secret lives in the gitignored local `.env`, with `.env.example` beside it, and in the CI's
secret store. The chain to production: GitHub secret, Terraform variable, Secret Manager, function
environment. Every place a token is replicated is listed in `project-context.md`; a rotation that
forgets one is found by an outage. A local API key is distinct from production's; keys are
compared by fingerprint (`printf '%s' "$k" | shasum`), never displayed.

## Dependencies

Renovate, self-hosted in a nightly workflow: `config:recommended`, non-major updates grouped in
one automerged pull request, majors automerged one by one, weekly lockfile maintenance. Every
`allowedVersions` bound carries its reason in `description` (a peer dependency the deploy's
stricter package manager rejects, a framework not yet on the new major). A strict install replayed
on the build artefact catches what the permissive local install let through. The package of this
stack has its own rule: label `stack`, no automerge, handled by the upgrade routine
([16-routines.md](16-routines.md)).
