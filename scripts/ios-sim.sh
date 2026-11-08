#!/usr/bin/env bash
# Drives the compiled app on an iOS simulator and collects what it finds into
# sim-output/: screenshots, logs, the accessibility tree, results.txt.
#
#   bash scripts/ios-sim.sh <group>
#
# Groups run as separate jobs in .github/workflows/ios-simulator.yml so each stays
# short. Every simulator and Maestro call has a time limit: a stall becomes a
# reported failure instead of an hour of silence, and later steps still run.

set -uo pipefail

GROUP="${1:-flows}"
BUNDLE=com.deusalter.hyperfocus
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/Hyperfocus.app"
OUT="$ROOT/sim-output/$GROUP"
RUNTIME=com.apple.CoreSimulator.SimRuntime.iOS-26-0
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export MAESTRO_DRIVER_STARTUP_TIMEOUT=240000

mkdir -p "$OUT"
RESULTS="$OUT/results.txt"
: > "$RESULTS"

log() { echo "[$(date +%H:%M:%S)] $*"; }
note() { log "$*"; echo "$*" >> "$RESULTS"; }

# with_timeout <seconds> <command...>: returns 124 if it had to be stopped
with_timeout() {
  local secs=$1
  shift
  "$@" &
  local pid=$!
  (
    sleep "$secs"
    kill -TERM "$pid" 2> /dev/null && sleep 5 && kill -KILL "$pid" 2> /dev/null
  ) &
  local watcher=$!
  wait "$pid"
  local rc=$?
  kill "$watcher" 2> /dev/null
  wait "$watcher" 2> /dev/null
  [ $rc -eq 143 ] || [ $rc -eq 137 ] && return 124
  return $rc
}

new_device() {
  local name="$1" type="$2"
  log "creating $name ($type)"
  UDID=$(with_timeout 120 xcrun simctl create "$name" "$type" "$RUNTIME") || {
    note "FAIL  could not create a $type simulator"
    return 1
  }
  log "booting $UDID"
  with_timeout 120 xcrun simctl boot "$UDID"
  # bootstatus can wait forever on a first boot that never reports finished
  if ! with_timeout 420 xcrun simctl bootstatus "$UDID" > /dev/null; then
    log "boot status never came back; carrying on, since the device is usually usable"
  fi
  with_timeout 60 xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged \
    --batteryLevel 100 --cellularMode active --cellularBars 4 --dataNetwork wifi --wifiMode active --wifiBars 3
  log "installing"
  with_timeout 180 xcrun simctl install "$UDID" "$APP" || {
    note "FAIL  install on $type"
    return 1
  }
  log "ready"
}

seed_state() {
  with_timeout 30 xcrun simctl terminate "$UDID" "$BUNDLE" 2> /dev/null
  local data dir
  data=$(with_timeout 30 xcrun simctl get_app_container "$UDID" "$BUNDLE" data)
  dir="$data/Library/Application Support/$BUNDLE/RCTAsyncLocalStorage_V1"
  mkdir -p "$dir"
  node "$ROOT/scripts/sim-seed.mjs" "$1" > "$dir/manifest.json"
}

# run_flow <subfolder> <flow>
run_flow() {
  local dir="$OUT/$1" flow="$2" start=$SECONDS
  mkdir -p "$dir"
  log "flow $1/$flow"
  if (cd "$dir" && with_timeout 480 maestro --device "$UDID" test "$ROOT/.maestro/$flow.yaml" > "$flow.log" 2>&1); then
    note "PASS  $1/$flow ($((SECONDS - start))s)"
  else
    note "FAIL  $1/$flow ($((SECONDS - start))s)"
    tail -25 "$dir/$flow.log" | sed 's/^/      /' >> "$RESULTS"
    with_timeout 30 xcrun simctl io "$UDID" screenshot "$dir/$flow-failure.png" > /dev/null 2>&1
  fi
}

start_log() {
  xcrun simctl spawn "$UDID" log stream --level debug \
    --predicate 'process == "Hyperfocus"' > "$OUT/app.log" 2>&1 &
  LOG_PID=$!
}
stop_log() { kill "$LOG_PID" 2> /dev/null; }

finish() {
  stop_log 2> /dev/null
  with_timeout 60 xcrun simctl shutdown "$UDID" 2> /dev/null
}

note "== $GROUP · $(xcodebuild -version | tr '\n' ' ')"

case "$GROUP" in
  flows)
    # every flow on the phone most people have, with the app's own log
    new_device hf-pro "iPhone 17 Pro" || exit 1
    start_log
    run_flow . 01-first-run
    run_flow . 02-capture-sort
    run_flow . 03-focus
    run_flow . 04-alerts
    seed_state full
    run_flow . 05-tour
    run_flow . 06-edit
    seed_state full
    run_flow . 07-keyboard
    seed_state full
    run_flow . 10-appearance
    seed_state full
    run_flow . 12-deep-link
    seed_state gentle
    run_flow . 08-gentle
    seed_state away
    run_flow . 09-coming-back
    seed_state full
    with_timeout 30 xcrun simctl launch "$UDID" "$BUNDLE" > /dev/null
    sleep 8
    # the accessibility tree a screen reader works from
    with_timeout 120 maestro --device "$UDID" hierarchy > "$OUT/a11y-home.json" 2> /dev/null
    finish
    ;;

  large-text)
    new_device hf-large "iPhone 17 Pro" || exit 1
    with_timeout 30 xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large
    seed_state full
    run_flow . 05-tour
    seed_state full
    run_flow . 03b-focus-screen
    finish
    ;;

  small)
    new_device hf-se "iPhone SE (3rd generation)" || exit 1
    run_flow . 01-first-run
    seed_state full
    run_flow . 05-tour
    seed_state full
    run_flow . 03b-focus-screen
    finish
    ;;

  dark-phone)
    # default settings on a phone set to dark, Reduce Motion and Reduce Transparency on
    new_device hf-dark "iPhone 17 Pro" || exit 1
    with_timeout 30 xcrun simctl ui "$UDID" appearance dark
    with_timeout 30 xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true
    with_timeout 30 xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility EnhancedBackgroundContrastEnabled -bool true
    seed_state full
    run_flow . 05-tour
    seed_state full
    run_flow . 11-springboard
    seed_state full
    run_flow . 10-appearance
    finish
    ;;

  store-6.9 | store-6.3)
    # Morning wherever this runner is, so the greeting reads well.
    HOUR=$(date -u +%H)
    OFFSET=$(((10 - 10#$HOUR + 36) % 24 - 12))
    if [ "$OFFSET" -ge 0 ]; then ZONE="Etc/GMT-$OFFSET"; else ZONE="Etc/GMT+$((-OFFSET))"; fi
    sudo ln -sf "/var/db/timezone/zoneinfo/$ZONE" /etc/localtime
    note "clock: $ZONE, now $(date)"
    if [ "$GROUP" = store-6.9 ]; then TYPE="iPhone 17 Pro Max"; else TYPE="iPhone 17 Pro"; fi
    new_device hf-store "$TYPE" || exit 1
    seed_state store-home
    run_flow . store-race
    seed_state store-focus
    run_flow . store-focus
    seed_state store-dump
    run_flow . store-dump
    seed_state full
    # slow, and on video: one frame of the card mid-swipe explains the gesture
    xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$OUT/swipe.mp4" &
    SWIPE_PID=$!
    run_flow . store-triage
    kill -INT "$SWIPE_PID" 2> /dev/null
    wait "$SWIPE_PID" 2> /dev/null
    seed_state store-recap
    run_flow . store-recap
    seed_state store-calendar
    run_flow . store-calendar
    seed_state store-home
    run_flow . store-insights
    finish
    ;;

  *)
    echo "unknown group: $GROUP" >&2
    exit 2
    ;;
esac

echo
cat "$RESULTS"
