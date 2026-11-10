import SwiftUI

// The Live Activity's views, kept free of ActivityKit so they're ordinary SwiftUI:
// each takes plain values. FocusLiveActivity.swift is the thin part that hands
// them what the system provides.

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
}

/// The Lock Screen, and the banner on phones without a Dynamic Island.
struct FocusLockScreenView: View {
  let glance: FocusGlance

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 12) {
        VStack(alignment: .leading, spacing: 2) {
          Text(glance.status)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(Color("muted"))
          Text(glance.title)
            .font(.headline)
            .foregroundStyle(Color("ink"))
            .lineLimit(2)
        }
        Spacer(minLength: 8)
        FocusClock(glance: glance, tint: Color("ink"), quiet: Color("muted"))
      }

      if glance.over {
        // The same question the recap asks. Only the person can say a task is done.
        Text("Open Hyperfocus to say whether you finished.")
          .font(.footnote)
          .foregroundStyle(Color("muted"))
      } else {
        FocusBar(glance: glance, tint: Color("accent"), paused: Color("muted"))
        if let firstStep = glance.firstStep, !firstStep.isEmpty {
          Text("First move: \(firstStep)")
            .font(.footnote)
            .foregroundStyle(Color("muted"))
            .lineLimit(1)
        }
      }
    }
    .padding(16)
  }
}

/// How long is left and what time that is: both, because turning a duration into
/// a clock time is the step that goes wrong.
struct FocusClock: View {
  let glance: FocusGlance
  let tint: Color
  let quiet: Color

  var body: some View {
    if glance.over {
      EmptyView()
    } else if glance.running {
      VStack(alignment: .trailing, spacing: 1) {
        Text(timerInterval: glance.span, countsDown: true)
          .font(.system(.title2, design: .rounded).weight(.semibold))
          .monospacedDigit()
          .multilineTextAlignment(.trailing)
          .foregroundStyle(tint)
          // a timer's Text asks for all the width there is unless it's told otherwise
          .frame(maxWidth: 92, alignment: .trailing)
        Text("until \(glance.endsAt, style: .time)")
          .font(.caption)
          .foregroundStyle(quiet)
      }
    } else {
      VStack(alignment: .trailing, spacing: 1) {
        Text(clockString(glance.remainingSec))
          .font(.system(.title2, design: .rounded).weight(.semibold))
          .monospacedDigit()
          .foregroundStyle(quiet)
        Text("left")
          .font(.caption)
          .foregroundStyle(quiet)
      }
    }
  }
}

/// One slow sweep for the whole session, drawn by the system so it moves with the
/// app asleep. Paused, it holds where it stopped.
struct FocusBar: View {
  let glance: FocusGlance
  let tint: Color
  let paused: Color

  var body: some View {
    if glance.running {
      ProgressView(timerInterval: glance.span, countsDown: false) {
        EmptyView()
      } currentValueLabel: {
        EmptyView()
      }
      .progressViewStyle(.linear)
      .tint(tint)
    } else {
      ProgressView(value: glance.fractionDone)
        .progressViewStyle(.linear)
        .tint(paused)
    }
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
        .font(.caption)
        .fontWeight(.semibold)
        .foregroundStyle(tint)
    } else if glance.running {
      Text(timerInterval: glance.span, countsDown: true)
        .font(.caption)
        .fontWeight(.semibold)
        .monospacedDigit()
        .multilineTextAlignment(.trailing)
        .foregroundStyle(tint)
        .frame(maxWidth: 44, alignment: .trailing)
    } else {
      Image(systemName: "pause.fill")
        .font(.caption)
        .foregroundStyle(tint)
    }
  }
}
