#!/usr/bin/env bash
#
# Build, install and launch the app on the physical iPhone named in
# project-context.md, whose CoreDevice id is IOS_DEVICE_ID (in .env or the shell).
# On request only: see the stack rule 10-ios.md, "Physical device".
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${IOS_DEVICE_ID:?IOS_DEVICE_ID is unset: the CoreDevice id from xcrun devicectl list devices}"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

bun run ios:project >/dev/null
bun run ios:codegen

echo "==> Building for device ${IOS_DEVICE_ID}"
# -allowProvisioningUpdates lets automatic signing register the device and mint the
# profile on first run.
xcodebuild -project ios/{{APP_NAME}}.xcodeproj -scheme {{APP_NAME}} \
  -destination "platform=iOS,id=${IOS_DEVICE_ID}" \
  -derivedDataPath build/device \
  -allowProvisioningUpdates \
  build

APP="build/device/Build/Products/Debug-iphoneos/{{APP_NAME}}.app"
echo "==> Installing ${APP}"
xcrun devicectl device install app "$APP" --device "$IOS_DEVICE_ID"
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")
echo "==> Launching ${BUNDLE_ID}"
xcrun devicectl device process launch --device "$IOS_DEVICE_ID" "$BUNDLE_ID"
