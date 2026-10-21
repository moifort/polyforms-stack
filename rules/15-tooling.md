# Tooling on the development machine

## Runtime

Always `bun` / `bunx`, never `npm` / `npx`. Biome for formatting and linting: spaces, single
quotes, no semicolons, line width 100.

## Xcode and simulators

- Build with the latest final Xcode. `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`
  is required for `xcodebuild`, `simctl` and `xcstringstool` while `xcode-select` points at the
  Command Line Tools; switching it needs the person's password.
- **Never download a simulator runtime or a platform without asking.** Each is several
  gigabytes. Only the versions matching the installed SDK; from the command line
  (`xcodebuild -downloadPlatform <name>`), never through Xcode's UI; one download at a time
  (`pgrep -f downloadPlatform` first, several block each other on "Preparing to download").
  Progress is the size of `/Library/Developer/CoreSimulator/Volumes`, not the program's messages.
- A download stuck on "Preparing to download" with no byte transferred is the network first: macOS
  suspends system asset downloads on a connection it considers cellular, an iPhone hotspot
  included, silently. Check the interface and the Wi-Fi name before anything else; the daemon is
  not broken.
- Simulators are shut down after every push by the hook; a capture uses a derived data path unique
  to the session and reinstalls right before each launch.
- `simctl io <udid> screenshot` works when the simulator tool's own capture fails.

## Browser

Always the built-in browser of the Claude app, never Claude in Chrome, even when asked to "go to
Chrome". When a page needs a sign-in, let the person sign in there. Some console actions have no
API (a price schedule, privacy answers, a subscription submission): they are done in that browser,
signed in as the person.

## Git and GitHub

- `gh` authenticates with a keyring token; a push changing workflow files may need SSH
  ([04-push.md](04-push.md#workflow-files)).
- Worktrees for parallel sessions, with the gitignored files copied in
  ([02-commits.md](02-commits.md#several-sessions-on-one-project)).
- The App Store Connect API key for scripts lives in `~/.appstoreconnect/private_keys/`, shared
  by every app of the team; its id and issuer are in each project's `project-context.md`.

## Remote control

Driving a project from the Claude app on a phone is a CLI process per project
(`claude remote-control --name <app> --permission-mode auto --spawn same-dir`), with its own
`claude auth login`, relaunched after a reboot. Check it with `pgrep -fl "claude remote-control"`.

## Reading production

Unattended reads (logs, metrics, billing, Firestore) go through the observer service account's own
`gcloud` configuration ([14-infra.md](14-infra.md)); `gcloud auth login` is the person's and
expires. Firestore's REST API needs `Content-Type: application/json` or answers a misleading 400.
