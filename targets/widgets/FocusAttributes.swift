import ActivityKit
import Foundation

// This file exists twice, word for word: in modules/focus-activity/ios, where the
// app starts and updates the Live Activity, and in targets/widgets, where the
// extension draws it. They're separate Swift modules that can't share a source
// file, and ActivityKit pairs them by this type's name and shape. A test
// (src/lib/__tests__/liveActivity.test.ts) fails if the two copies drift apart.

@available(iOS 16.2, *)
struct FocusAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// false while paused
    var running: Bool
    /// The end time less the session's length, so a bar can show how far in it is.
    var startedAt: Date
    /// When the session runs out. Only meaningful while running.
    var endsAt: Date
    /// Seconds left, as frozen when the session was paused.
    var remainingSec: Int
  }

  var title: String
  var firstStep: String?
}
