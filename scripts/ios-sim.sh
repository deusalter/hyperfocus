#!/usr/bin/env bash
# Drives the compiled app on an iOS simulator and collects what it finds into
# sim-output/<group>/: results.txt, then one folder per flow with its screenshots
# and log, plus the app's own log and the accessibility tree where a group takes them.
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
LOG_PID=""

# Newer Maestro writes screenshots under ~/.maestro/tests unless told otherwise
OUTPUT_FLAG=""
if maestro test --help 2>&1 | grep -q -- "--test-output-dir"; then OUTPUT_FLAG=1; fi

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

# 9:41, full bars and a plain full battery. SpringBoard can reset this when a slow
# first boot restarts it, which once left store shots with a live clock, so it's
# applied again before every flow.
pin_status_bar() {
  with_timeout 60 xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState discharging \
    --batteryLevel 100 --cellularMode active --cellularBars 4 --dataNetwork wifi --wifiMode active --wifiBars 3
}

new_device() {
  local name="$1" type="$2"
  log "creating $name ($type)"
  UDID=$(with_timeout 120 xcrun simctl create "$name" "$type" "$RUNTIME") || {
    note "FAIL  could not create a $type simulator"
    return 1
  }
  log "booting $UDID"
  # A first boot on a busy runner sometimes never finishes, and then nothing can
  # drive the device. Restarting it gets it going far more often than waiting does.
  local booted=""
  for attempt in 1 2; do
    with_timeout 120 xcrun simctl boot "$UDID" 2> /dev/null
    if with_timeout 360 xcrun simctl bootstatus "$UDID" > /dev/null; then
      booted=1
      break
    fi
    log "boot $attempt never finished; restarting the device"
    with_timeout 120 xcrun simctl shutdown "$UDID" 2> /dev/null
  done
  if [ -z "$booted" ]; then
    with_timeout 120 xcrun simctl boot "$UDID" 2> /dev/null
    note "NOTE  the $type never reported a finished boot, so failures below may be the device's"
  fi
  pin_status_bar
  # The first keyboard on a new device opens a full-screen slide-to-type tip. Real
  # phones have long since dismissed it; the suggestion bar stays, as on a real phone.
  for key in DidShowContinuousPathIntroduction DidShowGestureKeyboardIntroduction KeyboardDidShowProductivityTutorial; do
    with_timeout 30 xcrun simctl spawn "$UDID" defaults write com.apple.keyboard.preferences "$key" -bool true
  done
  log "installing"
  with_timeout 180 xcrun simctl install "$UDID" "$APP" || {
    note "FAIL  install on $type"
    return 1
  }
  # One launch creates the app's data folder. On a slow runner it wasn't there yet
  # when the first flow's data was written, so that flow opened on the welcome screen.
  with_timeout 60 xcrun simctl launch "$UDID" "$BUNDLE" > /dev/null 2>&1
  sleep 4
  with_timeout 30 xcrun simctl terminate "$UDID" "$BUNDLE" > /dev/null 2>&1
  log "ready"
}

seed_state() {
  with_timeout 30 xcrun simctl terminate "$UDID" "$BUNDLE" 2> /dev/null
  local data="" dir
  # a busy runner can take a while to answer, and an empty answer would seed nothing
  for _ in 1 2 3; do
    data=$(with_timeout 60 xcrun simctl get_app_container "$UDID" "$BUNDLE" data 2> /dev/null)
    [ -n "$data" ] && break
    sleep 5
  done
  if [ -z "$data" ]; then
    note "NOTE  couldn't find the app's data folder, so the next flow starts with no data"
    return 1
  fi
  dir="$data/Library/Application Support/$BUNDLE/RCTAsyncLocalStorage_V1"
  mkdir -p "$dir"
  node "$ROOT/scripts/sim-seed.mjs" "$1" > "$dir/manifest.json"
}

# run_flow <flow>: screenshots and log land in $OUT/<flow>/
run_flow() {
  local flow="$1" start=$SECONDS
  local dir="$OUT/$flow"
  mkdir -p "$dir"
  touch "$dir/.started"
  pin_status_bar
  log "flow $flow"
  local args=(--device "$UDID" test)
  [ -n "$OUTPUT_FLAG" ] && args+=(--test-output-dir "$dir/maestro")
  local tries=1
  while :; do
    if (cd "$dir" && with_timeout 480 maestro "${args[@]}" "$ROOT/.maestro/$flow.yaml" > "$dir/maestro.log" 2>&1); then
      note "PASS  $flow ($((SECONDS - start))s)"
      break
    fi
    # the app never got a say if Maestro's own test runner didn't start
    if [ $tries -eq 1 ] && grep -q "driver not ready in time" "$dir/maestro.log"; then
      log "the test driver never started; once more"
      tries=2
      continue
    fi
    note "FAIL  $flow ($((SECONDS - start))s)"
    tail -25 "$dir/maestro.log" | sed 's/^/      /' >> "$RESULTS"
    with_timeout 30 xcrun simctl io "$UDID" screenshot "$dir/failure.png" > /dev/null 2>&1
    break
  done
  # whichever folder this Maestro version wrote them to, bring the screenshots up
  # beside the log, where the artifact upload and the compositor look for them
  find "$dir/maestro" "$HOME/.maestro/tests" -name "*.png" -newer "$dir/.started" 2> /dev/null |
    while read -r png; do mv "$png" "$dir/"; done
  rm -f "$dir/.started"
}

# changed_bytes <a.png> <b.png>: how much of the band of the Lock Screen where a
# Live Activity sits differs between two captures.
changed_bytes() {
  local h w f
  h=$(sips -g pixelHeight "$1" | awk '/pixelHeight/ {print $2}')
  w=$(sips -g pixelWidth "$1" | awk '/pixelWidth/ {print $2}')
  for f in "$1" "$2"; do
    sips -s format bmp -c $((h * 28 / 100)) "$w" --cropOffset $((h * 62 / 100)) 0 "$f" --out "${f%.png}.bmp" > /dev/null 2>&1
  done
  cmp -l "${1%.png}.bmp" "${2%.png}.bmp" 2> /dev/null | wc -l | tr -d ' '
  rm -f "${1%.png}.bmp" "${2%.png}.bmp"
}

# still_ticking <flow>: the countdown on the Lock Screen is really being drawn.
# Maestro finds text through the accessibility tree, which once held a countdown
# that iOS wasn't painting, along with everything drawn after it. Two captures a
# few seconds apart settle it: a painted countdown has changed, and the same gap
# while paused shows how much changes when nothing should.
still_ticking() {
  local dir="$OUT/$1" running paused
  if [ ! -f "$dir/04b-lock-screen-running-later.png" ] || [ ! -f "$dir/05b-lock-screen-paused-later.png" ]; then
    return # the flow already failed before taking them, and said so
  fi
  running=$(changed_bytes "$dir/04-lock-screen-running.png" "$dir/04b-lock-screen-running-later.png")
  paused=$(changed_bytes "$dir/05-lock-screen-paused.png" "$dir/05b-lock-screen-paused-later.png")
  log "lock screen changed by $running bytes in four seconds running, $paused paused"
  if [ "${running:-0}" -lt 300 ] || [ "${running:-0}" -le $((${paused:-0} * 2)) ]; then
    note "FAIL  $1: the countdown is on the Lock Screen but isn't moving ($running bytes changed running, $paused paused)"
  fi
}

start_log() {
  xcrun simctl spawn "$UDID" log stream --level debug \
    --predicate 'process == "Hyperfocus"' > "$OUT/app.log" 2>&1 &
  LOG_PID=$!
}
stop_log() { if [ -n "$LOG_PID" ]; then kill "$LOG_PID" 2> /dev/null; fi; }

finish() {
  stop_log
  with_timeout 60 xcrun simctl shutdown "$UDID" 2> /dev/null
  return 0
}

note "== $GROUP · $(xcodebuild -version | tr '\n' ' ')· Maestro $(maestro --version 2> /dev/null | tail -1)"

case "$GROUP" in
  flows)
    # every flow on the phone most people have, with the app's own log
    new_device hf-pro "iPhone 17 Pro" || exit 1
    start_log
    run_flow 01-first-run
    run_flow 02-capture-sort
    seed_state fresh-start
    run_flow 03-focus
    seed_state full
    run_flow 04-alerts
    seed_state full
    run_flow 05-tour
    seed_state full
    run_flow 06-edit
    seed_state full
    run_flow 07-keyboard
    seed_state full
    run_flow 10-appearance
    seed_state full
    run_flow 12-deep-link
    seed_state gentle
    run_flow 08-gentle
    seed_state away
    run_flow 09-coming-back
    seed_state full
    with_timeout 30 xcrun simctl launch "$UDID" "$BUNDLE" > /dev/null
    sleep 8
    # the accessibility tree a screen reader works from
    with_timeout 120 maestro --device "$UDID" hierarchy > "$OUT/a11y-home.json" 2> /dev/null
    finish
    ;;

  lock-screen)
    # the Live Activity on the Lock Screen and the widget on the Home Screen, which
    # live in the widget extension and so never show up in the other groups
    new_device hf-lock "iPhone 17 Pro" || exit 1
    start_log
    seed_state full
    run_flow 14-live-activity
    still_ticking 14-live-activity
    seed_state lock-expiring
    run_flow 16-time-up
    seed_state full
    run_flow 15-widget
    # what SpringBoard offers at that point, for writing the next step against
    with_timeout 120 maestro --device "$UDID" hierarchy > "$OUT/a11y-springboard.json" 2> /dev/null
    finish
    ;;

  large-text)
    new_device hf-large "iPhone 17 Pro" || exit 1
    with_timeout 30 xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large
    seed_state full
    run_flow 13-large-text
    finish
    ;;

  small)
    new_device hf-se "iPhone SE (3rd generation)" || exit 1
    run_flow 01-first-run
    seed_state full
    run_flow 05-tour
    seed_state full
    run_flow 03b-focus-screen
    finish
    ;;

  dark-phone)
    # default settings on a phone set to dark, Reduce Motion and Reduce Transparency on
    new_device hf-dark "iPhone 17 Pro" || exit 1
    with_timeout 30 xcrun simctl ui "$UDID" appearance dark
    with_timeout 30 xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true
    with_timeout 30 xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility EnhancedBackgroundContrastEnabled -bool true
    seed_state full
    run_flow 05-tour
    seed_state full
    run_flow 11-springboard
    seed_state full
    run_flow 10-appearance
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
    run_flow store-race
    seed_state store-focus
    run_flow store-focus
    seed_state store-focus
    run_flow store-lock
    seed_state store-dump
    run_flow store-dump
    seed_state full
    # slow, and on video: one frame of the card mid-swipe explains the gesture
    xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$OUT/swipe.mp4" &
    SWIPE_PID=$!
    run_flow store-triage
    kill -INT "$SWIPE_PID" 2> /dev/null
    wait "$SWIPE_PID" 2> /dev/null
    seed_state store-recap
    run_flow store-recap
    seed_state store-calendar
    run_flow store-calendar
    seed_state store-home
    run_flow store-insights
    finish
    ;;

  *)
    echo "unknown group: $GROUP" >&2
    exit 2
    ;;
esac

echo
cat "$RESULTS"
# the job's colour should say whether every flow passed; the upload runs regardless
if grep -q "^FAIL" "$RESULTS"; then exit 1; fi
