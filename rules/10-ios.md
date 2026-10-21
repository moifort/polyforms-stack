# iOS

SwiftUI, Swift 6 strict concurrency, Apollo iOS for typed operations generated into
`Generated/GraphQL/` (never edited), Firebase Auth with Sign in with Apple, Sentry. Xcode file
system synchronised groups: a new file is picked up without touching the project. Long form in the
`ios-feature` skill.

## The one rule

**A view is either pure or connected, and its name says which.**

- **Pure**: receives values and actions, draws them. No API call, no fetching `.task`, no
  `.shared` singleton, no notification centre. Renders in a `#Preview` from fixtures alone.
  Everything under `components/` and `Shared/Components/` is pure, and
  `{{COMPONENTS_CHECK_COMMAND}}` fails the build when it is not.
- **Connected**: the `{Feature}Screen` at the root of a feature. It owns the ViewModel, the
  tasks, the change notices, the navigation and the sheets, and hands values and actions to its
  `Page`. It draws nothing of its own.

## Layout

```
Shared/Components/{atoms,molecules,organisms,styles}/   design system, pure
Shared/Platform/            UIKit wrappers: camera, mail composer, web view
Shared/Shell/               the app around the tabs: launch curtain, update-required screen
Features/{Domain}/
  {Feature}Screen.swift     connected
  {Feature}ViewModel.swift  state and actions, init(client:)
  {Domain}Client.swift      struct of async closures, .live and .preview
  {Domain}API.swift         GraphQL operations to app models, the only file that sees Apollo types
  {Domain}Models.swift      Sendable app models
  {Domain}Fixtures.swift    preview and test data
  components/{organisms,pages}/
```

- Domains follow the business, not the tabs. A component another domain needs is imported, not
  copied.
- Atoms and molecules live only in `Shared/`; a domain holds organisms and pages. A component
  small enough to be an atom carries no business meaning.
- Naming carries the category: `Screen` connected, `Page` pure whole screen, `Section`, `Card`,
  `Strip`, `Row`, `Tile` for organisms and molecules. A file named `…View` says nothing; new
  files never use it, except the UIKit wrappers named after what they wrap.
- One component per file, named after it. A private helper only that file uses may stay.

## Screen, page, action

- **One `onAction` per page, over an `enum`.** The screen's `switch` is exhaustive: an action
  added to the page and forgotten in the screen does not compile. A page with a dozen optional
  closures compiles with one left unwired. An organism with one or two actions takes plain
  closures.
- An action the page waits on is `async`, awaited through `AsyncButton` / `AsyncToolbarButton`,
  which draw the progress and disable the control. A page whose actions only open or switch takes
  a plain closure.
- Navigation state (which sheet, which destination) lives in the screen; the page only says what
  was tapped.
- Leaves take primitives (`String`, `Int?`, `Date?`, `Bool`, a logic-free enum, closures), never a
  domain struct; an organism may take a domain model and is the mapping boundary. Beyond about
  five parameters, a nested `Item` struct.

## ViewModel and client

- The client is a **struct of `@Sendable` closures** with `.live` and `.preview`, not a protocol:
  a test builds the client it needs inline, overriding one closure.
- The ViewModel is `@MainActor @Observable`, state `private(set)`, errors through the shared
  `reportError()`, never a generated type in sight.
- Business logic leaves the views: "look it up, then add it" exists once, as a client call or a
  domain function; formatting a line is a pure function on the model.
- No singleton read in a component: app services are read by the screen and passed down, or
  injected through the environment.

## Loading and failures

Every network call shows that it runs, except a refresh over content already on screen. A list
with nothing yet shows a `ProgressView` in its body, never full screen over the chrome. A button
that triggers a mutation shows its progress and is disabled while it runs.

- Over content already on screen, a failure says nothing: the rows stay. Replacing a good list
  with an empty one reads as data loss. The error still goes to Sentry.
- Over an empty screen, `EmptyState.failure(title, message, retry)`.
- Every screen that loads is pullable: refresh is the retry.
- A cancellation is not a failure: check it and return.

## Snapshots

A screen that changes slowly and that the person recognises keeps what it showed last on disk and
reopens on it. Read synchronously in the ViewModel's `init`, written after each successful load
off the main actor, one file per view and filter, **never more than the first page**, versioned
(bump when the type changes shape; an older file is ignored), cleared at sign-out and account
deletion, never for data worthless when stale (a quota, a subscription state). The refresh that
follows animates rows into place; a first fill over an empty screen does not animate. Images are
cached by what they are, not by their signed URL. No normalised client cache beyond this: its
freshness bugs cost more than it saves.

## Pagination

Long lists load by **cursor, never offset**: an offset shifts under a list that changed between
two pages. Page size is sized to the screen, not the dataset; the server caps a page. Prefetch
before the end, well below the page size. A load-more row closes the list while there is more,
with a retry once a page failed. A **generation token** guards every load: a page asked before a
reload is dropped. After an edit deep in the list, reload keeping depth, swapped in at once. When
the write named one row, patch that row rather than reload.

## Change notices

Every mutation goes through one helper that posts a single data-changed notice once the write
landed, carrying what changed when it is one row. Only screens listen; a page never subscribes.
Coming back to a tab asks nothing once the server has answered.

## Previews and tests

Every view has a `#Preview`: atoms, molecules, organisms, pages, one per state that matters.
Fixtures sit beside their type as `static let preview` or in `{Domain}Fixtures.swift`; tests reuse
them. A view that resists previewing is a design smell: pull the pure part out. Previews check
how a view looks; unit tests check what the app decides: ViewModels with an inline fake client
(state after a load, after a failure over rows and over nothing, a stale page dropped, a row
patched), and pure functions on models. Never a test of a SwiftUI `body`. A cached ViewModel takes
a no-cache option in tests. The unit test target runs in CI on every push.

## Design conventions

- Screens showing the same kind of object compose the same shared parts (the read-only header,
  labelled info rows, the status banner); only known fields are drawn; never a bespoke layout.
- An upcoming or announced date is orange, an available one green. A destructive button's icon is
  red too (a row label style keeps it accent blue unless coloured).
- Icons beside a title and a description sit at the **top** of the row, never centred.
- **No hint text under sections**: no footer explaining a picker. A message that matters in one
  state is a row inside the section, shown only in that state.
- Toolbar actions are icon-only, titles kept for VoiceOver; cancel on the left, confirm on the
  right.
- A tappable row answers on its whole width: a `.plain` button whose label carries
  `.contentShape(.rect)`, set in the row view. Never `onTapGesture` in place of a button.
- Native components, no custom re-skins.

## Build and capture

```bash
{{APP_BUILD_COMMAND}}
```

- Never clear the build cache to unblock a broken build; diagnose the cause.
- A build into a fresh derived data path needs `SWIFT_ENABLE_EXPLICIT_MODULES=NO` when Sentry's
  import fails on CoreTelephony. Use a derived data path unique to the session for screenshot
  builds: parallel sessions share the simulators and `/tmp`.
- `DEVELOPER_DIR` is required when `xcode-select` points at the Command Line Tools.
- A fresh worktree lacks the gitignored generated client, secrets file, Firebase plist and
  package resolution: copy them from the main checkout.
- Apollo codegen is the CLI bundled in the package checkout under derived data, not on PATH; after
  a `.graphql` change, run it before any build or install. Loop until the namespace file exists.

## Physical device

The install on the person's phone closes a task that touched the app, once the screenshot of the
change is approved, never before:

- **App only**: install right away, before any push. The phone talks to production, which has
  not changed.
- **Backend and app**: install after the push, once the Deploy workflow is green. Installing
  earlier ships an app against a server that does not have its changes yet.

Clean tree: run the install script in place. Dirty tree with another session's work: build HEAD
from a worktree. Run the API codegen first after a schema change. Relay the raw build and install
output; no success claim without it.
