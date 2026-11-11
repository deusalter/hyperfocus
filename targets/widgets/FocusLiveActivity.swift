import ActivityKit
import SwiftUI
import WidgetKit

private let focusURL = URL(string: "hyperfocus://focus")

/**
 A running session on the Lock Screen and in the Dynamic Island.

 Time blindness is the thing a timer is for, and a timer that's only visible
 inside its own app stops helping the moment you leave to do the work. This
 keeps the clock where the phone is looked at anyway. The countdown and the bar
 are drawn by the system from the end time, so they keep moving with the app
 asleep, and when the time runs out the system redraws this to say so.

 How it looks is FocusViews.swift. This file only hands those views what
 ActivityKit provides.
 */
struct FocusLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FocusAttributes.self) { context in
      FocusLockScreenView(glance: glance(context))
        .activityBackgroundTint(Palette.surface)
        .activitySystemActionForegroundColor(Palette.ink)
        .widgetURL(focusURL)
    } dynamicIsland: { context in
      let now = glance(context)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          FocusIslandTitle(glance: now)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          FocusClock(glance: now, tint: Island.ink, quiet: Island.muted, size: 24)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 8) {
            if now.over {
              Text("Open Hyperfocus to say whether you finished.")
                .font(Typeface.ui(13))
                .foregroundStyle(Island.muted)
            } else {
              FocusBar(glance: now, tint: Island.accent, paused: Island.muted)
              if let step = now.step {
                Text("First move: \(step)")
                  .font(Typeface.ui(13))
                  .foregroundStyle(Island.muted)
                  .lineLimit(1)
              }
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(.horizontal, 4)
          .padding(.top, 4)
        }
      } compactLeading: {
        Runner(pose: now.pose, fill: Island.accent, detail: Island.onAccent, height: 20)
          .padding(.leading, 2)
      } compactTrailing: {
        FocusCompactClock(glance: now, tint: Island.accent)
      } minimal: {
        Runner(pose: now.pose, fill: Island.accent, detail: Island.onAccent, height: 20)
      }
      .widgetURL(focusURL)
      .keylineTint(Island.accent)
    }
  }
}

private func glance(_ context: ActivityViewContext<FocusAttributes>) -> FocusGlance {
  FocusGlance(
    title: context.attributes.title,
    firstStep: context.attributes.firstStep,
    running: context.state.running,
    startedAt: context.state.startedAt,
    endsAt: context.state.endsAt,
    remainingSec: context.state.remainingSec,
    stale: context.isStale
  )
}
