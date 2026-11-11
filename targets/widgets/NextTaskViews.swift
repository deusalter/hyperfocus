import SwiftUI
import WidgetKit

/// The shapes the widget comes in. WidgetKit's own family type can't be made
/// outside a widget, and these views are also drawn by scripts/widget-preview.
enum WidgetSize {
  case small, medium, lockScreen
}

/**
 The next thing on Today, on the Home Screen or the Lock Screen.

 The app's weakness was that it did nothing until someone remembered to open it,
 which is the very thing it exists to help with. This puts the one task it would
 offer, and its first move, where the eye lands anyway. While a session runs it
 shows that session's clock, so a timer started and then forgotten stays in view.
 The wider one also carries the race.
 */
struct NextTaskView: View {
  let state: WidgetState
  /// the moment this is drawn for, which decides whether a session is still running
  let now: Date
  let size: WidgetSize

  private var session: (title: String, end: Date)? { state.session(at: now) }
  private var title: String? {
    guard let title = state.title, !title.isEmpty else { return nil }
    return title
  }
  private var firstStep: String? {
    guard let step = state.firstStep, !step.isEmpty else { return nil }
    return step
  }

  /// A tap goes to the screen that matches what the widget was showing.
  var destination: URL? {
    if session != nil { return URL(string: "hyperfocus://focus") }
    if title != nil { return URL(string: "hyperfocus://") }
    return URL(string: "hyperfocus://dump")
  }

  var body: some View {
    switch size {
    case .lockScreen:
      lockScreen
    case .small:
      main
    case .medium:
      HStack(alignment: .top, spacing: 14) {
        main
        if let race = state.race {
          Rectangle().fill(Palette.soft).frame(width: 1)
          RacePanel(race: race).frame(width: 128)
        }
      }
    }
  }

  @ViewBuilder private var main: some View {
    if let session = session {
      running(session.title, until: session.end)
    } else if let title = title {
      offer(title)
    } else {
      invitation
    }
  }

  private func eyebrow(_ text: String) -> some View {
    Text(text)
      .font(Typeface.ui(12, .bold))
      .foregroundStyle(Palette.muted)
  }

  private func headline(_ text: String, lines: Int) -> some View {
    Text(text)
      .font(Typeface.ui(17, .heavy))
      .tracking(-0.3)
      .foregroundStyle(Palette.ink)
      .lineLimit(lines)
      .minimumScaleFactor(0.86)
      .fixedSize(horizontal: false, vertical: true)
  }

  /// The one filled control, as on Home. A wide widget keeps the runner for the race.
  private func footer<Pill: View>(_ pill: Pill, pose: Runner.Pose) -> some View {
    HStack(alignment: .bottom, spacing: 0) {
      // the words on a button are never the thing to cut short
      pill.fixedSize()
      Spacer(minLength: 4)
      if size == .small || state.race == nil {
        Runner(pose: pose, fill: Palette.accent, detail: Palette.onAccent, height: 38)
      }
    }
  }

  private func offer(_ title: String) -> some View {
    VStack(alignment: .leading, spacing: 3) {
      eyebrow("Start one thing")
      headline(title, lines: size == .small ? 3 : 2)
      if size == .medium, let firstStep = firstStep {
        Text("First move: \(firstStep)")
          .font(Typeface.ui(13))
          .foregroundStyle(Palette.muted)
          .lineLimit(2)
          .fixedSize(horizontal: false, vertical: true)
          .padding(.top, 1)
      }
      Spacer(minLength: 4)
      footer(
        HStack(spacing: 6) {
          Image(systemName: "play.fill").font(.system(size: 9))
          Text("\(state.focusLen ?? 25) min").font(Typeface.ui(13, .bold))
        }
        .foregroundStyle(Palette.onAccent)
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(Capsule().fill(Palette.accent)),
        pose: .idle
      )
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func running(_ title: String, until end: Date) -> some View {
    VStack(alignment: .leading, spacing: 3) {
      eyebrow("Focusing on")
      headline(title, lines: 2)
      Spacer(minLength: 4)
      HStack(alignment: .bottom, spacing: 0) {
        VStack(alignment: .leading, spacing: 0) {
          // counts down by itself, with the app asleep
          Text(timerInterval: now...max(end, now), countsDown: true)
            .font(Typeface.digits(28))
            .tracking(-1)
            .foregroundStyle(Palette.accent)
          Text("until \(end, style: .time)")
            .font(Typeface.ui(12))
            .foregroundStyle(Palette.muted)
        }
        Spacer(minLength: 4)
        if size == .small || state.race == nil {
          Runner(pose: .run, fill: Palette.accent, detail: Palette.onAccent, height: 38)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var invitation: some View {
    VStack(alignment: .leading, spacing: 3) {
      eyebrow("Hyperfocus")
      headline("What's taking up space in your head?", lines: 3)
      Spacer(minLength: 4)
      footer(
        HStack(spacing: 6) {
          Image(systemName: "plus").font(.system(size: 10, weight: .bold))
          Text("Brain dump").font(Typeface.ui(13, .bold))
        }
        .foregroundStyle(Palette.accent)
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(Capsule().fill(Palette.accentSoft)),
        pose: .idle
      )
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  /// The Lock Screen draws in one tint, so this is words only.
  private var lockScreen: some View {
    VStack(alignment: .leading, spacing: 1) {
      if let session = session {
        Text("Focusing until \(session.end, style: .time)")
          .font(Typeface.ui(12, .bold))
          .widgetAccentable()
        Text(session.title)
          .font(Typeface.ui(15, .heavy))
          .lineLimit(2)
      } else if let title = title {
        Text("Start one thing")
          .font(Typeface.ui(12, .bold))
          .widgetAccentable()
        Text(title)
          .font(Typeface.ui(15, .heavy))
          .lineLimit(2)
      } else {
        Text("Hyperfocus")
          .font(Typeface.ui(12, .bold))
          .widgetAccentable()
        Text("Empty your head")
          .font(Typeface.ui(15, .heavy))
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// The race beside the task: the sentence Home leads with, today's points, the lane.
struct RacePanel: View {
  let race: WidgetState.Race

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(race.line)
        .font(Typeface.ui(14, .heavy))
        .tracking(-0.2)
        .foregroundStyle(Palette.ink)
        .lineLimit(2)
        .minimumScaleFactor(0.86)
        .fixedSize(horizontal: false, vertical: true)
      // Gentle mode's sentence is already today's points, so they aren't said twice
      if !(race.gentle ?? false) {
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text("\(race.points)")
          .font(Typeface.digits(13))
          .foregroundStyle(Palette.accent)
          // points only ever change by being earned, and the digits roll up to it
          .contentTransition(.numericText())
        Text("pts today")
          .font(Typeface.ui(12))
          .foregroundStyle(Palette.muted)
      }
      }
      Spacer(minLength: 4)
      RaceLane(race: race, runnerHeight: 36)
        .frame(height: 48)
    }
    .frame(maxHeight: .infinity, alignment: .topLeading)
  }
}
