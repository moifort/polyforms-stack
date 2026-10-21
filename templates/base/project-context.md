# Project context

The facts of this project. Nothing here is a rule (rules live in the stack) and nothing
here should be copied into another project.

## Environments

| Environment | GCP project | Notes |
|---|---|---|
| Production | `{{APP_SLUG}}-polyforms` | |
| Staging | `{{APP_SLUG}}-staging-polyforms` | Deployed from pull requests labelled `staging` |

## Accounts and consoles

Which account opens which console, and the access trick if there is one.

## Analytics and monitoring

Sentry projects `{{APP_SLUG}}-node` and `{{APP_SLUG}}-ios` (org `polyforms`). GA4 property, dashboards.

## Test devices

Name, identifier, signing team, trust state.

## Certificates and keys

| Item | Role | Created | Expires |
|---|---|---|---|
| | Signing | | |
| | App Store Connect API | | |

## Where each secret lives

Every token and the places it is replicated, with the example file beside each ignored one.

## Decisions specific to this project

Structuring choices and their reason, when neither the code nor the history says it. An
architecture choice gets an ADR in `docs/adr/`.

## Pending work

What is started, what remains to be done by hand, what waits on someone else.
