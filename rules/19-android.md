# Android

Applies to a project with an Android app. The Android app is a mirror of the iOS app: iOS is
where a feature is designed, built and validated; Android follows.

## Android follows iOS, and catches up before every release

- `android/` is never where a feature starts.
- When a release is asked for, before tagging `ios-v*`: list the iOS commits since the previous
  release (`git log ios-v<previous>..HEAD -- ios shared`), port each one to the Kotlin file of the
  same name, regenerate the strings, build and test Android, capture the changed screens on the
  emulator, then cut both releases with the same version (`ios-v*` and `android-v*`). No release
  is cut while Android lags.
- The project's `docs/android-guide.md` holds the mapping table and the stack versions.

## The mirror

- Every Swift file has a Kotlin file of the same name in the same place
  (`ios/<App>/Features/Book/BookScreen.swift` → `android/…/features/book/BookScreen.kt`). Porting
  a diff is reading the Swift file and editing the Kotlin file of the same name.
- The iOS one rule holds: a composable is pure (renders from values) or connected (the
  `…Screen` that owns its view model).
- A `{Domain}Client` struct of closures becomes an interface with a `live` implementation; an
  `@Observable` view model a class of `mutableStateOf` fields with suspend actions; the data
  change notice a `SharedFlow`.
- Android conventions win only where the platform imposes them: the back gesture, system bars,
  the share sheet, permissions, date pickers.

## One API contract

- Apollo Kotlin generates from the iOS operation documents (`ios/<App>/**/*.graphql`) and
  `shared/schema.graphql`; only Android-only operations live under `android/app/src/main/graphql/`.
  Moving a fragment between iOS files breaks Android: build Android after any `.graphql` edit.
- The `/app-config` route carries an Android update floor and store link next to the iOS ones.

## Copy

Strings come from the iOS catalogue: a script writes `assets/strings.json`, looked up by the
source-language key. The few sentences only Android says (Google where iOS says Apple, Play where
it says the App Store) live in a hand-kept file beside it.

## Tooling

- JDK 21 (`JAVA_HOME=$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home`), one
  emulator created once and reused, like the iOS simulator.
- Sign-in is Google only on Android; Biome stays off `android/`.
- A debug build opens a page from its fixtures through an intent extra, as the iOS harness does
  with a launch argument: screenshots never wait on a sign-in.
- CI: `build-android` on every change under `android/` or to the shared GraphQL documents;
  `release-android` on an `android-v*` tag, to a Play track.
