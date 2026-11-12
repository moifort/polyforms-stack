# Changelog

One section per version, newest first, in English. Each section says, for a project that
upgrades to it:

- **New**: what the stack now offers (a rule, a skill, a template, a routine, a command);
- **Changed**: what works differently, and what a project must change because of it;
- **Fixed**: what was wrong and now works;
- **Upgrade**: the migrations, each with its risk, or "nothing to do".

The upgrade routine reads the **Upgrade** part first, and the release tag carries the whole
section as its message.

## 0.4.0 (2026.11.12)

Guardrails: what the package installs, and what its templates generate, are checked by CI.

### New
- Template `test-unit` workflow and `preflight` script: `bunx stack check` runs after Biome and
  at the end of the preflight (rule `12-ci`, **Stack checks**). A file under `stack/`, the rules
  block of `CLAUDE.md`, a skill or a hook edited by hand, or not synced, fails. Intended effect:
  the Renovate pull request that bumps `@moifort/stack` is red until the upgrade routine has run
  `sync` on its branch, so a bump is never merged unsynced.
- Template `scripts/check-rules.ts`, `bun run rules:check`, in the preflight and the `unit` job:
  the rules a search settles are checked, not re-read. `flat-collections`: no subcollection under
  `server/` (`09-backend`); `warm-instance`: no `min_instance_count` or `minInstances` above
  zero (`11-ops`); `derived-data`: no `-derivedDataPath` under `/tmp` in `scripts/` or
  `package.json` (`15-tooling`). `bun scripts/check-rules.ts <name>` runs one.
- Template `biome.json`: `noConsole` on `server/`, tests excepted (`09-backend`, Observability).
- Skills `ai-calls` (the Gemini billing detail and the dated model table, from `13-ai`),
  `cold-start` (what the template does for a cold start and how to measure one, from `11-ops`)
  and `ios-simulator` (runtime downloads, a download stuck on "Preparing to download", a crash
  at boot, from `15-tooling`).
- The package's CI generates a backend and iOS project when the iOS or base templates, `src/`
  or `bin/` change, and runs its `ios:build`, `ios:test`, `ios:strings` and `ios:components`.

### Changed
- The rules every session loads are lighter (1,770 lines to 1,676): the trap stories and the long
  procedures that serve one task moved, unchanged, to skills read on demand; each rule keeps its
  normative sentence and names the skill. `07-appstore` (captures and panels, listing, first
  subscription) into `appstore`; `10-ios` (scrolling performance, screen patterns) into
  `ios-feature`; `11-ops`, `13-ai` and `15-tooling` into the new skills above. `01-workflow`
  lists every skill the package ships, by stack.

### Fixed
- Skill `ios-feature` built screenshots into a new `/tmp` path per topic, which `15-tooling`
  forbids: it now builds into the default or the worktree's fixed derived data.
- Template `scripts/check-strings.ts` compares the catalogue's content, not the order of its
  keys: a freshly generated app failed `ios:strings` because its tagline key, rendered from a
  placeholder, sorts elsewhere than the placeholder did.

### Upgrade
- `bunx stack sync`: the rules shrink and the new skills land in `.claude/skills/` (commit them
  where the project tracks that folder).

In the order `stack migrations` lists them: the checks of `flat-collections` and
`no-warm-instance` run the script that `check-rules-script` copies.

- `check-rules-script` (safe): copy `scripts/check-rules.ts`, add the `rules:check` script,
  call it in `preflight` before `stack:check` and in the `unit` job after `bunx stack check`. A
  failing `derived-data` check is fixed as the 0.2.0 migration `derived-data-reuse` says.
- `flat-collections` (review): a subcollection becomes a top-level collection keyed by `userId`,
  with a data migration. A project built from the template passes as is.
- `no-console-in-server` (review): the `noConsole` override in `biome.json`, then each
  `console.*` under `server/` becomes a `createLogger` call at the level its meaning says.
- `no-warm-instance` (safe): `min_instance_count = 0` in `infra/function.tf`, no `minInstances`
  in `nitro.config.ts`.
- `stack-check-in-ci` (safe): `stack:check` at the end of `preflight`, and `bunx stack check` in
  the `unit` job of `test-unit.yml`, after Biome.
- `scripts/check-strings.ts` (ios): nothing to do; a project's catalogue was put in order by its
  first `ios:strings --write`. Copy the template's file to get the content comparison.

## 0.3.2 (2026.11.12)

An audit of the package against itself: what the rules say and what the package ships.

### Changed
- `bun run validate`, in the package's CI, now refuses what a re-read used to catch late: a link
  or an anchor that does not resolve, a `bun run <script>` no template has, a `stack <command>`
  the CLI lacks (unless the file says "Not shipped yet"), a migration absent from its version's
  section here, sections out of order, a catalogue entry without its file, and a project name in
  anything a project receives, hooks and templates included.

### Fixed
- Routine `stack-upgrade` takes the major dependency pull requests: it listed only the `stack`
  label, so the `major` ones were never found. It works in the task's cloned repositories, as a
  cloud routine does, no longer under the machine's code folder and `/tmp`.
- Rules that described what is not built now say so, with what is done meanwhile: `bootstrap`,
  `teardown` and `infra/org/` (`14-infra`, the `stack-install` skill), the `PolyformsUI` Swift
  package (`10-ios`, which now lists the components the template really seeds), the `pages`
  workflow and `storage.tf` (`12-ci`, `14-infra`), the Android app and its workflows
  (`19-android`).
- Rules that contradicted the templates: the build number is the commit count, not the run
  number (`05-release`, `12-ci`); the iOS unit tests run in `build-ios` before a release, not on
  every push (`10-ios`); `sync` renders the routines into `stack/routines/` (`16-routines`); no
  derived data under `/tmp` to delete after a push (`04-push`); template paths (`12-ci`,
  `14-infra`); `ios-upload` in the workflows table.
- No project name left in the rules, the migrations and the templates; the push hook's comment
  and message are in English; the `stack-install` skill lists the `android` stack and says
  `init` stops on a missing placeholder instead of asking.
- Routine `daily-health` is a desktop task: it reads production through the observer `gcloud`
  configuration, which only the machine holds. It was declared `cloud` (`16-routines`).
- Renovate runs with the `RENOVATE_TOKEN` repository secret, as its workflow always did;
  `14-infra` described a GitHub App.

- The `stack-install` skill says what each stack brings (rules, routines, skills, templates),
  and that `paid`, `admin` and `e2e` select nothing yet; the validation keeps its table in step
  with the catalogue.
- Rule `09-backend` promised a migration from `export namespace` blocks to modules imported
  with `import * as`, and none existed: it ships now.

### Upgrade
- `namespace-to-module-imports` (review, backend): every `export namespace Name { … }` becomes
  bare exports, every importer `import * as Name`, test mocks and dynamic imports included,
  one domain per commit; then Biome's `noNamespace` is turned on.
- `bunx stack sync`, then update the `stack-upgrade` scheduled task from
  `stack/routines/stack-upgrade.md`.
- Machine: `daily-health` runs as a desktop scheduled task; a cloud task created for it is
  deleted.
- `.github/workflows/renovate.yml` and `nitro.config.ts` changed in a comment only: nothing to
  copy.

## 0.3.1 (2026.11.12)

Security fixes merged by Renovate.

### New
- Rule `11-ops`, **Dependencies**: Dependabot alerts on, Dependabot security updates off;
  Renovate opens and merges the security fixes, and its token must read the alerts.
- Template `renovate.json`: `vulnerabilityAlerts` labels its pull requests `security`.

### Changed
- Rule `14-infra`: `infra/org/` turns Dependabot alerts on for the repository.

### Upgrade
- Turn Dependabot alerts on: `gh api -X PUT repos/<owner>/<repo>/vulnerability-alerts`; then
  `gh api -i repos/<owner>/<repo>/vulnerability-alerts` answers `204`. Leave Dependabot
  security updates off: `gh api repos/<owner>/<repo> --jq
  .security_and_analysis.dependabot_security_updates.status` says `disabled`.
- In `renovate.json`, before `lockFileMaintenance`, add
  `"vulnerabilityAlerts": { "labels": ["dependencies", "security"] }`.
- Check that Renovate's token reads the alerts: a classic token with `repo`, a fine-grained
  token or a GitHub App with **Dependabot alerts: read**.

## 0.3.0 (2026.11.12)

Harvested from Shiori: reading a slow screen, and keeping it fast.

### New
- Rule `09-backend`, **Read models**: a screen drawn from a whole library and its shared
  documents is kept as one document per reader, gzipped, with its freshness fields; a per-reader
  stamp, written by a GraphQL plugin after every mutation and by the scheduled writers, says when
  it went stale; the hourly route rewrites the stale ones of active readers.
- Rule `09-backend`, **Observability**: the `operation served` line the GraphQL plugin already
  logs for each operation (duration and Firestore reads), and how to rank operations with it
  before reading code.
- Routine `daily-health`: ranks GraphQL operations by latency and reads, and checks that the
  passes keeping shared documents fresh actually refresh them, not only that they answer 200.
- Template `server/test/fake-firestore.ts`: `select` on a query, returning only the fields named.

### Upgrade
Run `bunx stack sync`. Nothing else to do: the read model is a pattern applied screen by screen,
when the operation log shows one above about a hundred reads or a second at p50. A project whose
`server/test/fake-firestore.ts` diverged from the template adds `select` by hand (the
`FakeQuery` and `FakeCollection` types, the `fields` of the query state, and the projection of
`data()` in `get`).

## 0.2.1 (2026.11.12)

### Fixed
- `sync` writes the hooks executable. They were written without the execute bit, so the
  `PostToolUse` hook it registers failed on every Bash call of a session.
- The `stack-install` skill no longer runs `init` in an existing app, which added the template's
  app skeleton beside the real one: it writes `stack.config.json`, syncs, keeps `.claude/skills`,
  `.claude/hooks` and `.claude/settings.json` tracked, replaces the project's own copy of the
  method, then applies the migrations batch by batch.

### Upgrade
- `bunx stack sync`: it sets the execute bit on `.claude/hooks/*.sh`. Commit `.claude/hooks/`
  if the project tracks it.

## 0.2.0 (2026.11.12)

Harvested from Shiori, three weeks after 0.1.

### New
- Rule `18-design`: the design board kept in sync with the app, the prototyping zone, variants,
  one child session per board comment (resolved once handled, validated in the child), mockups
  (scroll to the change, working variant on top, change only what is asked, 512 KB), concept
  icons picked from numbered library boards.
- Rule `19-android` and the `android` stack: the Android app mirrors iOS file by file and
  catches up before every release; one GraphQL contract; strings from the iOS catalogue.
- Android components follow atomic design, stay pure and carry a `@Preview`, checked by
  `templates/android/scripts/check-android-components.ts` in `build-android`.
- A UI change is validated twice, board then app (`01-workflow`); iteration rounds on one piece
  of UI are one commit (`02-commits`); short labels, no tag for the app's own language
  (`08-copy`); empty states, blur never darken, no `Menu` in a `GlassEffectContainer`, and a
  scrolling performance section (`10-ios`); the cold start measured and cut (`11-ops`).
- Routine `ios-disk-cleanup`: weekly, on the machine.
- Templates: `server/system/boot-marks.ts`, `server/utils/nightly-pass.ts`,
  `scripts/stable-mtimes.py`, `memoizedManyPerRequest` in the request cache.

### Changed
- Deploy calls the three test workflows and waits for them: nothing reaches production on red
  tests. The test workflows no longer run on their own on `main`.
- The iOS app builds at release (`release-ios` calls `build-ios` and stops on its failure), no
  longer on every push; `build-ios` restores warm Swift packages and derived data. Rule `12-ci`
  drops "one build per commit".
- The backend bundles its dependencies (Firebase, gRPC, Sentry excepted), talks REST to
  Firestore, skips Sentry's module loader hook, and serves sixteen requests per instance on 1 GiB.
- Simulators are booted through the Claude app's simulator tool or Simulator.app, never
  `simctl boot` alone, and shut down at the first crash; derived data is never a fresh path per
  build (`15-tooling`, `10-ios`, `01-workflow`).
- Biome 2.6.6, Markdown and YAML left unformatted; `bun test`, `tsc` and Biome skip `build/`
  and `.claude/` (the worktrees of parallel sessions).
- A change to how projects are built goes into this package first, with its Upgrade steps
  (`00-collaboration`).

### Upgrade
Run `bunx stack sync`, then each migration, in this order:
- `local-checks-skip-worktrees` (safe): `bunfig.toml`, `tsconfig.json`, `biome.json`, Biome 2.6.6.
- `derived-data-reuse` (safe, ios): no `-derivedDataPath` under `/tmp` in the scripts.
- `deploy-waits-on-tests` (review, backend): `test-*.yml` become `workflow_call`, `deploy.yml`
  needs them, its concurrency moves onto the job.
- `ios-build-at-release` (review, ios): `build-ios.yml` replaced, `release-ios.yml` gains
  `ios-checks`, `scripts/stable-mtimes.py` added.
- `cold-start` (review, backend): `boot-marks.ts`, the two plugins, `firebase.ts`,
  `nitro.config.ts`, `infra/function.tf`; build and run the bundle locally before pushing.
- `request-cache-scopes` (review, backend): `request-cache.ts` and its test, `nightly-pass.ts`,
  `fake-firestore.ts`.
- `android-components-previewed` (review, android): the components check, a preview surface,
  a `@Preview` in every component file, the check in `build-android.yml`.
- Machine: install the `ios-disk-cleanup` routine (desktop scheduled task, Mondays 10:00).

## 0.1.2 (2026.10.24)

### Fixed
- `bunx @moifort/stack` runs again. The CLI resolved its modules through a path alias only the
  repository's `tsconfig.json` declares, and npm does not ship that file, so every command of
  0.1.1 failed with "Cannot find module '~/config'". A test now runs the CLI from the packed
  package.
- A project generated with the ios stack passes `bun run lint` right after `init`, whatever the
  app is called: `scripts/apollo-codegen.ts` and `scripts/check-strings.ts` no longer spell the
  name inline.
- `bun run ios:build` succeeds on a fresh project: `scripts/apollo-codegen.ts` exports
  `shared/schema.graphql` when it is missing instead of failing on a schema it cannot find.
- The release tag and the GitHub release keep their `### New`, `### Fixed`, `### Upgrade`
  headings: git dropped them as comment lines when it wrote the tag message.

### Upgrade
- Nothing to do. A project generated with 0.1.1 got past these steps with `bun run lint:fix`
  and `bun run generate`, and its committed schema keeps its iOS build working.

## 0.1.1 (2026.10.21)

### Fixed
- `init` writes the project's `.gitignore` again. npm leaves every `.gitignore` out of a
  published package, so 0.1.0 generated projects without one; the template now ships it as
  `gitignore` and `init` renames it.

### Upgrade
- Nothing to do. A project generated with 0.1.0 copies `.gitignore` from the template by hand.

## 0.1.0 (2026.10.21)

### New
- Rules `00` to `17`, harvested from Shiori: collaboration, workflow, commits, review, push,
  release, changelog, App Store, copy, backend, iOS, operations, CI, AI, infrastructure,
  tooling, routines, landing page.
- Routines: Sentry autofix, daily health, upgrades, deprecations.
- Skills: `domain`, `graphql`, `ios-feature`, `appstore`, `stack-install`, `stack-upgrade`.
- Templates: base, backend (Nitro, Firestore, GraphQL, Terraform, workflows), iOS (SwiftUI app
  generated by XcodeGen, workflows, fastlane).
- CLI: `init`, `sync`, `check`, `migrations`, `placeholders`.

### Upgrade
- First version: install with `bunx @moifort/stack init --stacks <stacks>`.
