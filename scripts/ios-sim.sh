#!/usr/bin/env bash
# Drives the compiled app on iOS simulators and collects what it finds into
# sim-output/: screenshots, the accessibility tree, app logs, a video, results.txt.
# Every step keeps going after a failure, so one problem doesn't hide the rest.
# Run from .github/workflows/ios-simulator.yml.

set -uo pipefail

BUNDLE=com.deusalter.hyperfocus
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/Hyperfocus.app"
OUT="$ROOT/sim-output"
RUNTIME=com.apple.CoreSimulator.SimRuntime.iOS-26-0
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=240000

mkdir -p "$OUT"
RESULTS="$OUT/results.txt"
: > "$RESULTS"

note() { echo "$*" | tee -a "$RESULTS"; }

new_device() {
  local name="$1" type="$2"
  UDID=$(xcrun simctl create "$name" "$type" "$RUNTIME")
  xcrun simctl boot "$UDID"
  xcrun simctl bootstatus "$UDID" -b > /dev/null
  xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged --batteryLevel 100 \
    --cellularMode active --cellularBars 4 --dataNetwork wifi --wifiMode active --wifiBars 3
  xcrun simctl install "$UDID" "$APP"
}

seed_state() {
  xcrun simctl terminate "$UDID" "$BUNDLE" 2> /dev/null
  local data dir
  data=$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data)
  dir="$data/Library/Application Support/$BUNDLE/RCTAsyncLocalStorage_V1"
  mkdir -p "$dir"
  node "$ROOT/scripts/sim-seed.mjs" "$1" > "$dir/manifest.json"
}

# run_flow <folder> <flow name>
run_flow() {
  local dir="$OUT/$1" flow="$2"
  mkdir -p "$dir"
  local start=$SECONDS
  if (cd "$dir" && maestro --device "$UDID" test "$ROOT/.maestro/$flow.yaml" > "$flow.log" 2>&1); then
    note "PASS  $1/$flow ($((SECONDS - start))s)"
  else
    note "FAIL  $1/$flow ($((SECONDS - start))s)"
    tail -25 "$dir/$flow.log" | sed 's/^/      /' >> "$RESULTS"
    xcrun simctl io "$UDID" screenshot "$dir/$flow-failure.png" > /dev/null 2>&1
  fi
}

hierarchy() {
  (maestro --device "$UDID" hierarchy > "$OUT/$1.json") 2>> "$OUT/hierarchy.log"
}

start_log() {
  xcrun simctl spawn "$UDID" log stream --level debug \
    --predicate 'process == "Hyperfocus"' > "$OUT/$1.log" 2>&1 &
  LOG_PID=$!
}
stop_log() { kill "$LOG_PID" 2> /dev/null; }

note "== $(xcodebuild -version | tr '\n' ' ')"

# ---- iPhone 17 Pro: every flow, on video, with app logs ----

new_device hf-pro "iPhone 17 Pro"
start_log pro
xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$OUT/flows.mp4" &
VIDEO_PID=$!

run_flow pro 01-first-run
run_flow pro 02-capture-sort
run_flow pro 03-focus
run_flow pro 04-alerts

kill -INT "$VIDEO_PID" 2> /dev/null
wait "$VIDEO_PID" 2> /dev/null

seed_state full
run_flow pro 05-tour
run_flow pro 06-edit
seed_state full
run_flow pro 07-keyboard
seed_state full
run_flow pro 10-appearance
seed_state full
run_flow pro 11-springboard
seed_state gentle
run_flow pro 08-gentle
seed_state away
run_flow pro 09-coming-back

# the accessibility tree a screen reader would be working from
seed_state full
xcrun simctl launch "$UDID" "$BUNDLE" > /dev/null
sleep 6
hierarchy a11y-home

stop_log
xcrun simctl shutdown "$UDID"

# ---- The largest text iOS offers ----

new_device hf-large "iPhone 17 Pro"
xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large
seed_state full
run_flow large-text 05-tour
seed_state full
run_flow large-text 03b-focus-screen
xcrun simctl shutdown "$UDID"

# ---- The smallest phone that can run it ----

new_device hf-se "iPhone SE (3rd generation)"
run_flow se 01-first-run
seed_state full
run_flow se 05-tour
seed_state full
run_flow se 03b-focus-screen
xcrun simctl shutdown "$UDID"

# ---- Reduce Motion, Reduce Transparency, and a phone set to dark ----

new_device hf-a11y "iPhone 17 Pro"
xcrun simctl ui "$UDID" appearance dark
xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true
xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility EnhancedBackgroundContrastEnabled -bool true
# default settings on a dark phone: this should still come up light
seed_state full
run_flow reduced 05-tour
seed_state full
run_flow reduced 11-springboard
seed_state full
run_flow reduced 10-appearance
xcrun simctl shutdown "$UDID"

echo
cat "$RESULTS"
