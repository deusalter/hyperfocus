#!/bin/bash
# Draws the widget extension's views on this Mac, as PNGs. No Xcode, no simulator.
#
#   bash scripts/widget-preview.sh [output folder]
#
# The extension's Swift can't be built here, but most of it is plain SwiftUI that
# doesn't care which Apple platform it's on. This compiles those files for macOS
# with a stand-in palette and renders them with ImageRenderer. It leaves out the
# files that need WidgetKit's or ActivityKit's own types: what those hand to the
# views is filled in by scripts/widget-preview/Scenes.swift instead.
#
# What it can't show: the system's own drawing of a Live Activity's timer and bar,
# and the Dynamic Island's shape. The simulator workflow's lock-screen group does.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/widget-preview-out}"
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

SOURCES=()
for file in "$ROOT"/targets/widgets/*.swift; do
  case "$(basename "$file")" in
    # the asset-catalog palette, and the three files that are WidgetKit or ActivityKit
    Palette.swift | index.swift | FocusLiveActivity.swift | NextTaskWidget.swift | FocusAttributes.swift) ;;
    *) SOURCES+=("$file") ;;
  esac
done

swiftc -O -target arm64-apple-macosx13.0 -o "$BUILD/preview" \
  "${SOURCES[@]}" "$ROOT"/scripts/widget-preview/*.swift
"$BUILD/preview" "$OUT" "$ROOT/targets/widgets/fonts"
echo "drawn to $OUT"
