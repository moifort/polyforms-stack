---
id: cold-start
risk: review
stacks: [backend]
rule: rules/11-ops.md#scale-to-zero
check: test -f server/system/boot-marks.ts && grep -q 'preferRest' server/system/firebase.ts && grep -q 'BUNDLED_AS_FILES' nitro.config.ts
---

**What changes.** A cold start spent most of its time loading `node_modules` file by file. The
template now bundles the dependencies in (Firebase, gRPC and Sentry excepted), talks to
Firestore over REST, skips Sentry's module loader hook, logs where each cold start goes, and
serves sixteen requests per instance on 1 GiB.

**How to fix**, each step from `node_modules/@moifort/stack/templates/backend/`:

1. Copy `server/system/boot-marks.ts`.
2. `server/plugins/00-sentry.ts`: import `markBootStep` first (with the `biome-ignore-all
   assist/source/organizeImports` line above it), call `markBootStep('bundleRestMs')` after the
   dev guard, add `enableRuntimeChannelInjection: false` to `Sentry.init`, then
   `markBootStep('sentryMs')`.
3. `server/plugins/02-graphql.ts`: after `setApollo(apollo)`, `if (import.meta.dev) return`,
   `markBootStep('apolloMs')`, `logBootSteps()`.
4. `server/system/firebase.ts`: inside the `getApps().length === 0` guard, after
   `initializeApp()`, `getFirestore().settings({ preferRest: true })`. Not if the server uses
   Firestore listeners (`onSnapshot`): they need gRPC.
5. `nitro.config.ts`: add the `BUNDLED_AS_FILES` constant, `externals` and `commonJS` blocks;
   `httpsOptions` gets `memory: '1GiB'`, `cpu: 1`, `concurrency: 16`.
6. `infra/function.tf`: `available_memory = "1Gi"`, `max_instance_request_concurrency = 16`.
7. `bun run build`, run the bundle locally under the Functions Framework
   ([11-ops.md](../../rules/11-ops.md#scale-to-zero)) and check one request answers and the
   `boot steps` line is logged before pushing. A package that fails once bundled (it reads files
   through `__dirname`, or is required by deep path) is added to `BUNDLED_AS_FILES`.

**Does not apply** to a project not deployed as a Cloud Function.
