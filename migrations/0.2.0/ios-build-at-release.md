---
id: ios-build-at-release
risk: review
stacks: [ios]
rule: rules/12-ci.md#rules
check: grep -q 'workflow_call' .github/workflows/build-ios.yml && grep -q 'ios-checks' .github/workflows/release-ios.yml && test -f scripts/stable-mtimes.py
---

**What changes.** A push to `main` no longer builds the app on a macOS runner; the iOS release
calls the build, its unit tests, the strings and components checks first, and a failure stops
the upload and the submission. The build itself is warm on a fresh runner (six to eight minutes
instead of seventeen).

**How to fix.**

1. Copy `templates/ios/.github/workflows/build-ios.yml` and `templates/ios/scripts/stable-mtimes.py`
   from `node_modules/@moifort/stack/`, render `{{APP_NAME}}` and `{{APP_SLUG}}`, and carry over
   any step the project added to its own `build-ios.yml` (UI test secrets, a test pre-action).
   The trigger becomes `on: { workflow_call:, workflow_dispatch: }`.
2. In `.github/workflows/release-ios.yml`: add the job
   `ios-checks: { uses: ./.github/workflows/build-ios.yml, secrets: inherit }`; the upload job
   gets `needs: [version, ios-checks]`; the submit job gets `needs: [version, ios-checks, release]`
   and `needs.ios-checks.result == 'success' &&` in its `if`.
3. Remove `build-ios` from any branch protection that required it on pushes.

**Does not apply** to a project without an iOS app.
