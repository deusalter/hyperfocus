import SwiftUI

// The Live Activity's views, kept free of ActivityKit so they're ordinary SwiftUI:
// each takes plain values. FocusLiveActivity.swift is the thin part that hands
// them what the system provides, and scripts/widget-preview draws them on a Mac.

/// What a session looks like at a glance, worked out once for every view.
struct FocusGlance {
  let title: String
  let firstStep: String?
  let running: Bool
  let startedAt: Date
  let endsAt: Date
  let remainingSec: Int
  /// the system marked it stale, which happens at the moment the clock runs out
  let stale: Bool

  /// The clock has run out and the app hasn't been opened to say how it went.
  var over: Bool { running && (stale || endsAt <= Date()) }

  /// Never backwards, which SwiftUI's timer views refuse to draw.
  var span: ClosedRange<Date> { min(startedAt, endsAt)...endsAt }

  var fractionDone: Double {
    let total = endsAt.timeIntervalSince(startedAt)
    guard total > 0 else { return 0 }
    return min(1, max(0, 1 - Double(remainingSec) / total))
  }

  var status: String { over ? "Time's up" : running ? "Focusing on" : "Paused" }

  /// The companion does what the session is doing.
  var pose: Runner.Pose { over ? .cheer : running ? .run : .idle }

  var step: String? {
    guard let step = firstStep, !step.isEmpty else { return nil }
    return step
  }
}

/// The companion in its own round patch, the way the app's tinted buttons sit.
struct RunnerBadge: View {
  let pose: Runner.Pose
  var size: CGFloat = 46
  var fill: Color = Palette.accent
  var detail: Color = Palette.onAccent
  var patch: Color = Palette.accentSoft

  var body: some View {
    Circle()
      .fill(patch)
      .frame(width: size, height: size)
      .overlay(
        Runner(pose: pose, fill: fill, detail: detail, height: size * 0.72)
          // the box is drawn from its top left, and the figure sits right of centre in it
          .offset(x: -size * 0.02, y: size * 0.03)
      )
  }
}

/// The Lock Screen, and the banner on phones without a Dynamic Island.
struct FocusLockScreenView: View {
  let glance: FocusGlance

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .center, spacing: 12) {
        RunnerBadge(pose: glance.pose)
        VStack(alignment: .leading, spacing: 1) {
          Text(glance.status)
            .font(Typeface.ui(12, .bold))
            .foregroundStyle(glance.over ? Palette.accent : Palette.muted)
          Text(glance.title)
            .font(Typeface.ui(17, .heavy))
            .tracking(-0.3)
            .foregroundStyle(Palette.ink)
            .lineLimit(2)
            .fixedSize(horizontal: false, vertical: true)
        }
        Spacer(minLength: 6)
        FocusClock(glance: glance, tint: Palette.ink, quiet: Palette.muted)
      }

      if glance.over {
        // The same question the recap asks. Only the person can say a task is done.
        Text("Open Hyperfocus to say whether you finished.")
          .font(Typeface.ui(13))
          .foregroundStyle(Palette.muted)
      } else {
        FocusBar(glance: glance, tint: Palette.accent, paused: Palette.muted)
        if let step = glance.step {
          Text("First move: \(step)")
            .font(Typeface.ui(13))
            .foregroundStyle(Palette.muted)
            .lineLimit(1)
        }
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 15)
  }
}

/// How long is left and what time that is: both, because turning a duration into
/// a clock time is the step that goes wrong.
struct FocusClock: View {
  let glance: FocusGlance
  let tint: Color
  let quiet: Color
  var size: CGFloat = 27

  var body: some View {
    if glance.over {
      EmptyView()
    } else if glance.running {
      VStack(alignment: .trailing, spacing: 0) {
        TimerDigits(span: glance.span, font: Typeface.digits(size), tracking: -1, tint: tint)
        Text("until \(glance.endsAt, style: .time)")
          .font(Typeface.ui(12))
          .foregroundStyle(quiet)
      }
    } else {
      VStack(alignment: .trailing, spacing: 0) {
        Text(clockString(glance.remainingSec))
          .font(Typeface.digits(size))
          .tracking(-1)
          .foregroundStyle(quiet)
          // a second change while paused is the ±5 buttons, and the digits roll
          .contentTransition(.numericText(countsDown: true))
        Text("left")
          .font(Typeface.ui(12))
          .foregroundStyle(quiet)
      }
    }
  }
}

/**
 A countdown that takes exactly the room its digits need.

 A timer's Text asks for all the width on offer, enough for hours it may never
 show, and pushes whatever is beside it around. So the room is set by ordinary
 digits of the same shape, drawn but not shown, and the live ones sit on top,
 pinned to the trailing edge.
 */
struct TimerDigits: View {
  let span: ClosedRange<Date>
  let font: Font
  let tracking: CGFloat
  let tint: Color

  /// an hour or more left shows as 1:00:00, which is wider
  private var template: String {
    span.upperBound.timeIntervalSinceNow >= 3600 ? "0:00:00" : "00:00"
  }

  var body: some View {
    Text(template)
      .font(font)
      .tracking(tracking)
      .hidden()
      .overlay(alignment: .trailing) {
        Text(timerInterval: span, countsDown: true)
          .font(font)
          .tracking(tracking)
          .multilineTextAlignment(.trailing)
          .foregroundStyle(tint)
          .fixedSize()
      }
  }
}

/// One slow sweep for the whole session, drawn by the system so it moves with the
/// app asleep. Paused, it holds where it stopped. Thicker than the system's own,
/// to read as the app's lane.
struct FocusBar: View {
  let glance: FocusGlance
  let tint: Color
  let paused: Color

  var body: some View {
    #if os(iOS)
    Group {
      if glance.running {
        ProgressView(timerInterval: glance.span, countsDown: false) {
          EmptyView()
        } currentValueLabel: {
          EmptyView()
        }
        .tint(tint)
      } else {
        ProgressView(value: glance.fractionDone)
          .tint(paused)
      }
    }
    .progressViewStyle(.linear)
    .scaleEffect(x: 1, y: 1.6, anchor: .center)
    .frame(height: 7)
    #else
    // The Mac can't draw a timer-driven bar at all, so scripts/widget-preview gets a
    // still one of the same weight to judge the layout by.
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(Palette.soft)
        Capsule().fill(glance.running ? tint : paused)
          .frame(width: max(7, geo.size.width * CGFloat(glance.fractionDone)))
      }
    }
    .frame(height: 7)
    #endif
  }
}

/// The Dynamic Island's compact side: just the countdown, or a word when there
/// isn't one running.
struct FocusCompactClock: View {
  let glance: FocusGlance
  let tint: Color

  var body: some View {
    if glance.over {
      Text("Done?")
        .font(Typeface.ui(13, .bold))
        .foregroundStyle(tint)
    } else if glance.running {
      TimerDigits(span: glance.span, font: Typeface.digits(13), tracking: 0, tint: tint)
    } else {
      Image(systemName: "pause.fill")
        .font(.caption)
        .foregroundStyle(tint)
    }
  }
}

/// The Dynamic Island, opened by a long press: the same three lines as the Lock
/// Screen, in the island's fixed colours.
struct FocusIslandTitle: View {
  let glance: FocusGlance

  var body: some View {
    HStack(spacing: 10) {
      RunnerBadge(
        pose: glance.pose, size: 40, fill: Island.accent, detail: Island.onAccent, patch: Island.soft)
      VStack(alignment: .leading, spacing: 1) {
        Text(glance.status)
          .font(Typeface.ui(12, .bold))
          .foregroundStyle(glance.over ? Island.accent : Island.muted)
        Text(glance.title)
          .font(Typeface.ui(16, .heavy))
          .tracking(-0.3)
          .foregroundStyle(Island.ink)
          .lineLimit(2)
      }
    }
  }
}
