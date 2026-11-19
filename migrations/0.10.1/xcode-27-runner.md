---
id: xcode-27-runner
risk: safe
stacks: [ios]
rule: templates/ios/.github/workflows/build-ios.yml
check: "! grep -rq 'runs-on: macos-26' .github/workflows/"
---

**What changes.** The iOS workflows run on the `xcode-27` GitHub image instead of `macos-26`. On
`macos-26` the newest Xcode carries the iOS 26 SDK: App Store Connect answers every upload with
ITMS-90725 and refuses such builds from April 2027.

**How to fix.** In `.github/workflows/build-ios.yml` and `.github/workflows/ios-upload.yml`, replace
`runs-on: macos-26` with `runs-on: xcode-27`. The simulator picker takes the newest iPhone 17
runtime on its own, so nothing else moves; update any comment naming the image's iOS runtimes.

**Check.** `grep -rn "macos-26" .github/workflows/` finds nothing. The next iOS build run prints
Xcode 27 in its "Select the latest final Xcode" step, and the next upload brings no ITMS-90725 mail.
