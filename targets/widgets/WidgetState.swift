import Foundation

/// The App Group the app and this extension share. Also in app.json and
/// src/lib/liveActivity.ts.
let appGroup = "group.com.deusalter.hyperfocus"

/// What the app last said it would offer, written by `setWidgetState` in the
/// FocusActivity module. Every field is optional: a widget that can't read its
/// data should show its invitation, not an error.
struct WidgetState: Codable, Equatable {
  /// the task Home would offer to start
  var title: String?
  var firstStep: String?
  /// the usual session length, in minutes
  var focusLen: Int?
  /// set only while a session is running
  var sessionTitle: String?
  /// epoch milliseconds
  var sessionEndsAt: Double?

  var sessionEnd: Date? {
    guard let ms = sessionEndsAt else { return nil }
    return Date(timeIntervalSince1970: ms / 1000)
  }

  /// A session that's still running at `date`.
  func session(at date: Date) -> (title: String, end: Date)? {
    guard let title = sessionTitle, let end = sessionEnd, end > date else { return nil }
    return (title, end)
  }

  static let empty = WidgetState()

  /// For the widget gallery, where there's no data yet and an empty box sells nothing.
  static let sample = WidgetState(
    title: "Draft intro for history essay",
    firstStep: "open the doc and type one line",
    focusLen: 25
  )

  static func load() -> WidgetState {
    guard
      let json = UserDefaults(suiteName: appGroup)?.string(forKey: "widgetState"),
      let data = json.data(using: .utf8),
      let state = try? JSONDecoder().decode(WidgetState.self, from: data)
    else { return .empty }
    return state
  }
}

/// Seconds as a clock, the way the app writes it: 16:58.
func clockString(_ seconds: Int) -> String {
  let s = max(0, seconds)
  return "\(s / 60):" + String(format: "%02d", s % 60)
}
