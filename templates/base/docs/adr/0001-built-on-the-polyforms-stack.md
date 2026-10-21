# 0001. Built on the Polyforms stack

Date: {{TODAY}}

## Context

Every Polyforms app shares one way of being built: a Bun and Nitro backend on Firebase,
GraphQL through Pothos, Terraform, one CI workflow per concern, Sentry, scheduled routines,
and for apps with a phone client, SwiftUI with the stack's conventions.

## Decision

This project consumes the `@moifort/stack` package. Its rules are rendered into `stack/`
and imported by `CLAUDE.md`; its templates seeded the repository; a version bump arrives as
a Renovate pull request and is applied by the upgrade routine.

## Consequences

A rule is never changed here: a correction that holds for every project goes into the
package and comes back as a version. What is specific to this project is written in
`CLAUDE.md`, `project-context.md` and the ADRs that follow this one.
