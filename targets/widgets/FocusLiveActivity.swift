import ActivityKit
import SwiftUI
import WidgetKit

/// The Dynamic Island is always black, whatever the phone's appearance, so its
/// colours are fixed: the dark theme's accent and ink from src/lib/colors.json.
private let islandAccent = Color(red: 0x8f / 255, green: 0xb4 / 255, blue: 0xda / 255)
private let islandInk = Color(red: 0xe6 / 255, green: 0xe9 / 255, blue: 0xea / 255)
private let islandMuted = Color(red: 0xa2 / 255, green: 0xaa / 255, blue: 0xae / 255)

private let focusURL = URL(string: "hyperfocus://focus")

/**
 A running session on the Lock Screen and in the Dynamic Island.

 Time blindness is the thing a timer is for, and a timer that's only visible
 inside its own app stops helping the moment you leave to do the work. This
 keeps the clock where the phone is looked at anyway. The countdown and the bar
 are drawn by the system from the end time, so they keep moving with the app
 asleep, and when the time runs out the system redraws this to say so.
 */
struct FocusLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FocusAttributes.self) { context in
      FocusLockScreenView(glance: glance(context))
        .activityBackgroundTint(Color("surface"))
        .activitySystemActionForegroundColor(Color("ink"))
        .widgetURL(focusURL)
    } dynamicIsland: { context in
      let now = glance(context)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(now.status)
              .font(.caption)
              .fontWeight(.semibold)
              .foregroundStyle(islandMuted)
            Text(now.title)
              .font(.headline)
              .foregroundStyle(islandInk)
              .lineLimit(2)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          FocusClock(glance: now, tint: islandInk, quiet: islandMuted)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if now.over {
            Text("Open Hyperfocus to say whether you finished.")
              .font(.footnote)
              .foregroundStyle(islandMuted)
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(.horizontal, 4)
          } else {
            FocusBar(glance: now, tint: islandAccent, paused: islandMuted)
              .padding(.horizontal, 4)
          }
        }
      } compactLeading: {
        Image(systemName: now.over ? "checkmark.circle" : "timer")
          .font(.caption)
          .foregroundStyle(islandAccent)
      } compactTrailing: {
        FocusCompactClock(glance: now, tint: islandAccent)
      } minimal: {
        Image(systemName: now.over ? "checkmark.circle" : now.running ? "timer" : "pause.fill")
          .font(.caption)
          .foregroundStyle(islandAccent)
      }
      .widgetURL(focusURL)
      .keylineTint(islandAccent)
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
