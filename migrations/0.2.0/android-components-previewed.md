---
id: android-components-previewed
risk: review
stacks: [android]
rule: rules/19-android.md#components
check: bun scripts/check-android-components.ts
---

**What changes.** Android components follow the iOS rules: pure, and previewed. Shiori's port
had the atomic folders and pure components, but not one `@Preview` in 96 files, and nothing in
CI kept it that way.

**How to fix.**

1. Copy `templates/android/scripts/check-android-components.ts` from
   `node_modules/@moifort/stack/` into `scripts/`, and run it: it lists every component that
   reaches the server, a view model, change notices or a singleton, and every file declaring a
   composable without a `@Preview`.
2. Move what reaches the server out of `components/` into the `…Screen`, passing values and
   actions down instead.
3. Add one preview surface at the app's root package (`PreviewSurface(dark, content)`: the
   app's theme, a `NavigationStack`, the grouped background) and extend the debug fixtures
   object with what the pages need (a followed series, an author page…).
4. At the end of each listed file, add
   `@Preview(showBackground = true) @Composable private fun <Name>Preview() = PreviewSurface { … }`
   drawing its composables from the fixtures. A page with heavy state shows its loaded state
   with fixtures; a sheet, its default content.
5. In `.github/workflows/build-android.yml`: add `scripts/check-android-components.ts` to the
   `paths` of both triggers, and before Gradle, `oven-sh/setup-bun@v2` then
   `run: bun scripts/check-android-components.ts`.
6. `./gradlew :app:testDebugUnitTest :app:assembleDebug` with JDK 21, then the check again.

**Does not apply** to a project without an Android app.
