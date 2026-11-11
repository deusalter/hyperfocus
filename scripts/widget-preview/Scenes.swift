import SwiftUI

// What gets drawn: every state of the widget and the Live Activity, light and dark.
// Add a state here when a view gains one.

private let now = Date()

private func glance(running: Bool = true, over: Bool = false, step: String? = "open the doc and type one line")
  -> FocusGlance
{
  FocusGlance(
    title: "Draft intro for history essay",
    firstStep: step,
    running: running,
    startedAt: now.addingTimeInterval(-8 * 60),
    endsAt: now.addingTimeInterval(17 * 60),
    remainingSec: 17 * 60,
    stale: over
  )
}

private let race = WidgetState.Race(
  points: 69, pacer: 99, ghosts: [33, 48, 99, 117, 129, 177, 60], line: "3 of 7 passed")
private let ahead = WidgetState.Race(
  points: 132, pacer: 99, ghosts: [33, 48, 99, 117, 129, 177, 60], line: "Past a typical day")
private let gentle = WidgetState.Race(points: 48, pacer: 0, ghosts: [], line: "48 pts so far today", gentle: true)

private let offer = WidgetState(
  title: "Draft intro for history essay", firstStep: "open the doc and type one line", focusLen: 25, race: race)
private let long = WidgetState(
  title: "Finish the chemistry lab report and upload it to Canvas before midnight", focusLen: 45, race: ahead)
private let session = WidgetState(
  title: "Email counselor about transcript", focusLen: 25, sessionTitle: "Draft intro for history essay",
  sessionEndsAt: (now.timeIntervalSince1970 + 17 * 60) * 1000, race: race)
private let nothing = WidgetState(focusLen: 25, race: gentle)

private let small = CGSize(width: 170, height: 170)
private let medium = CGSize(width: 364, height: 170)

@MainActor
func drawEverything() {
  for dark in [false, true] {
    save("activity", dark: dark) { VStack(spacing: 10) {
      activity(FocusLockScreenView(glance: glance()))
      activity(FocusLockScreenView(glance: glance(running: false)))
      activity(FocusLockScreenView(glance: glance(over: true)))
      activity(FocusLockScreenView(glance: glance(step: nil)))
    } }

    save("widget-small", dark: dark) { HStack(spacing: 0) {
      widget(small, NextTaskView(state: offer, now: now, size: .small))
      widget(small, NextTaskView(state: session, now: now, size: .small))
      widget(small, NextTaskView(state: nothing, now: now, size: .small))
      widget(small, NextTaskView(state: long, now: now, size: .small))
    } }

    save("widget-medium", dark: dark) { VStack(spacing: 0) {
      widget(medium, NextTaskView(state: offer, now: now, size: .medium))
      widget(medium, NextTaskView(state: session, now: now, size: .medium))
      widget(medium, NextTaskView(state: long, now: now, size: .medium))
      widget(medium, NextTaskView(state: nothing, now: now, size: .medium))
    } }
  }

  // the Dynamic Island is black whatever the theme
  save("island") { HStack(spacing: 14) {
    HStack(spacing: 60) {
      Runner(pose: .run, fill: Island.accent, detail: Island.onAccent, height: 20)
      FocusCompactClock(glance: glance(), tint: Island.accent)
    }
    .padding(.horizontal, 10).frame(height: 37).background(Capsule().fill(.black))
    VStack(alignment: .leading, spacing: 10) {
      HStack {
        FocusIslandTitle(glance: glance())
        Spacer()
        FocusClock(glance: glance(), tint: Island.ink, quiet: Island.muted, size: 24)
      }
      FocusBar(glance: glance(), tint: Island.accent, paused: Island.muted)
      Text("First move: open the doc and type one line").font(Typeface.ui(13)).foregroundStyle(Island.muted)
    }
    .padding(18).frame(width: 370)
    .background(RoundedRectangle(cornerRadius: 40, style: .continuous).fill(.black))
  }.padding(12).background(Color(white: 0.5)) }
}
