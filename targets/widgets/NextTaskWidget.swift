import SwiftUI
import WidgetKit

/**
 The next thing on Today, on the Home Screen or the Lock Screen.

 The app's weakness was that it did nothing until someone remembered to open it,
 which is the very thing it exists to help with. This puts the one task it would
 offer, and its first move, where the eye lands anyway. While a session runs it
 shows that session's clock, so a timer started and then forgotten stays in view.
 */
struct NextTaskEntry: TimelineEntry {
  let date: Date
  let state: WidgetState
}

struct NextTaskProvider: TimelineProvider {
  func placeholder(in context: Context) -> NextTaskEntry {
    NextTaskEntry(date: Date(), state: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (NextTaskEntry) -> Void) {
    completion(NextTaskEntry(date: Date(), state: context.isPreview ? .sample : .load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NextTaskEntry>) -> Void) {
    let now = Date()
    let state = WidgetState.load()
    var entries = [NextTaskEntry(date: now, state: state)]
    // The app can't be relied on to be awake when a session runs out, so the
    // moment it does is scheduled here: the widget goes back to offering the task.
    if let session = state.session(at: now) {
      entries.append(NextTaskEntry(date: session.end, state: state))
    }
    // Nothing else changes until the app says so, and it reloads this itself.
    completion(Timeline(entries: entries, policy: .never))
  }
}

struct NextTaskWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NextTask", provider: NextTaskProvider()) { entry in
      NextTaskView(entry: entry)
        .containerBackground(for: .widget) { Color("surface") }
    }
    .configurationDisplayName("Start one thing")
    .description("The next thing on Today, and its first move.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

struct NextTaskView: View {
  @Environment(\.widgetFamily) private var family
  let entry: NextTaskEntry

  private var session: (title: String, end: Date)? { entry.state.session(at: entry.date) }
  private var title: String? {
    guard let title = entry.state.title, !title.isEmpty else { return nil }
    return title
  }
  private var firstStep: String? {
    guard let step = entry.state.firstStep, !step.isEmpty else { return nil }
    return step
  }

  var body: some View {
    Group {
      if family == .accessoryRectangular {
        lockScreen
      } else if let session = session {
        running(session.title, until: session.end)
      } else if let title = title {
        offer(title)
      } else {
        invitation
      }
    }
    .widgetURL(destination)
  }

  /// A tap goes to the screen that matches what the widget was showing.
  private var destination: URL? {
    if session != nil { return URL(string: "hyperfocus://focus") }
    if title != nil { return URL(string: "hyperfocus://") }
    return URL(string: "hyperfocus://dump")
  }

  private func eyebrow(_ text: String) -> some View {
    Text(text)
      .font(.caption)
      .fontWeight(.semibold)
      .foregroundStyle(Color("muted"))
  }

  private func offer(_ title: String) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      eyebrow("Start one thing")
      Text(title)
        .font(.headline)
        .foregroundStyle(Color("ink"))
        .lineLimit(family == .systemSmall ? 3 : 2)
        .minimumScaleFactor(0.85)
      if family != .systemSmall, let firstStep = firstStep {
        Text("First move: \(firstStep)")
          .font(.footnote)
          .foregroundStyle(Color("muted"))
          .lineLimit(2)
      }
      Spacer(minLength: 4)
      HStack(spacing: 6) {
        Image(systemName: "play.fill")
          .font(.caption2)
        Text("\(entry.state.focusLen ?? 25) min")
          .font(.footnote)
          .fontWeight(.semibold)
      }
      .foregroundStyle(Color("onAccent"))
      .padding(.horizontal, 12)
      .padding(.vertical, 7)
      .background(Capsule().fill(Color("accent")))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func running(_ title: String, until end: Date) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      eyebrow("Focusing on")
      Text(title)
        .font(.headline)
        .foregroundStyle(Color("ink"))
        .lineLimit(2)
        .minimumScaleFactor(0.85)
      Spacer(minLength: 4)
      // counts down by itself, with the app asleep
      Text(timerInterval: entry.date...max(end, entry.date), countsDown: true)
        .font(.system(.title, design: .rounded).weight(.semibold))
        .monospacedDigit()
        .foregroundStyle(Color("accent"))
      Text("until \(end, style: .time)")
        .font(.caption)
        .foregroundStyle(Color("muted"))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var invitation: some View {
    VStack(alignment: .leading, spacing: 4) {
      eyebrow("Hyperfocus")
      Text("What's taking up space in your head?")
        .font(.headline)
        .foregroundStyle(Color("ink"))
        .lineLimit(3)
        .minimumScaleFactor(0.85)
      Spacer(minLength: 4)
      HStack(spacing: 6) {
        Image(systemName: "plus")
          .font(.caption2.weight(.bold))
        Text("Brain dump")
          .font(.footnote)
          .fontWeight(.semibold)
      }
      .foregroundStyle(Color("accent"))
      .padding(.horizontal, 12)
      .padding(.vertical, 7)
      .background(Capsule().fill(Color("accentSoft")))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  /// The Lock Screen draws in one tint, so this is words only.
  private var lockScreen: some View {
    VStack(alignment: .leading, spacing: 1) {
      if let session = session {
        Text("Focusing until \(session.end, style: .time)")
          .font(.caption)
          .widgetAccentable()
        Text(session.title)
          .font(.headline)
          .lineLimit(2)
      } else if let title = title {
        Text("Start one thing")
          .font(.caption)
          .widgetAccentable()
        Text(title)
          .font(.headline)
          .lineLimit(2)
      } else {
        Text("Hyperfocus")
          .font(.caption)
          .widgetAccentable()
        Text("Empty your head")
          .font(.headline)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}
