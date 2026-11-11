import SwiftUI
import WidgetKit

// The WidgetKit side of the widget: when it's drawn, and from what. How it looks
// is NextTaskViews.swift.

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
      NextTaskEntryView(entry: entry)
        .containerBackground(for: .widget) { Palette.surface }
    }
    .configurationDisplayName("Start one thing")
    .description("The next thing on Today, its first move, and the race.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

struct NextTaskEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: NextTaskEntry

  private var size: WidgetSize {
    switch family {
    case .accessoryRectangular: return .lockScreen
    case .systemMedium: return .medium
    default: return .small
    }
  }

  var body: some View {
    let view = NextTaskView(state: entry.state, now: entry.date, size: size)
    view
      .widgetURL(view.destination)
      // The system animates a widget from one state to the next with a spring. This
      // app's own motion never overshoots, so its widget doesn't either.
      .animation(.easeOut(duration: 0.28), value: entry.state)
  }
}
