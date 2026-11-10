import ExpoModulesCore
import WidgetKit

#if canImport(ActivityKit)
import ActivityKit
#endif

/// A session as JavaScript describes it. See src/lib/liveActivity.ts.
struct FocusSessionRecord: Record {
  @Field var title: String = ""
  @Field var firstStep: String?
  @Field var running: Bool = true
  /// epoch milliseconds
  @Field var endsAt: Double = 0
  @Field var totalSec: Int = 0
  @Field var remainingSec: Int = 0
}

/**
 The app side of the Lock Screen Live Activity and the Home Screen widget.

 Both calls describe how things should be, not what just happened. `sync` is
 handed the session as it stands and makes the Live Activity match, whether that
 means starting one, updating it or replacing it. That's the shape the rest of the
 app already uses for the "time's up" notification, and it means a restart, a
 missed call or a call made twice can't leave the Lock Screen showing something
 that isn't true.
 */
public class FocusActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FocusActivity")

    Function("sync") { (session: FocusSessionRecord) in
      if #available(iOS 16.2, *) {
        let snapshot = FocusActivityController.Snapshot(
          title: session.title,
          firstStep: session.firstStep,
          running: session.running,
          endsAt: Date(timeIntervalSince1970: session.endsAt / 1000),
          totalSec: session.totalSec,
          remainingSec: session.remainingSec
        )
        FocusActivityController.enqueue { await FocusActivityController.sync(snapshot) }
      }
    }

    Function("end") {
      if #available(iOS 16.2, *) {
        FocusActivityController.enqueue { await FocusActivityController.end() }
      }
    }

    // What the widget shows, as one JSON string in the App Group's defaults. The
    // widget extension is a separate process and can't see AsyncStorage.
    Function("setWidgetState") { (json: String?, group: String) in
      let defaults = UserDefaults(suiteName: group)
      if let json = json {
        defaults?.set(json, forKey: "widgetState")
      } else {
        defaults?.removeObject(forKey: "widgetState")
      }
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

#if canImport(ActivityKit)
@available(iOS 16.2, *)
enum FocusActivityController {
  struct Snapshot: Sendable {
    let title: String
    let firstStep: String?
    let running: Bool
    let endsAt: Date
    let totalSec: Int
    let remainingSec: Int
  }

  // Calls arrive in order from JavaScript, but each does its work across an await,
  // so a pause followed at once by a resume could otherwise land the wrong way
  // round. Each piece of work waits for the one before it.
  private static var last: Task<Void, Never> = Task {}

  static func enqueue(_ work: @escaping @Sendable () async -> Void) {
    let previous = last
    last = Task {
      await previous.value
      await work()
    }
  }

  static func sync(_ session: Snapshot) async {
    // off in Settings, or a device that can't show them: nothing to do, and no error
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

    let state = FocusAttributes.ContentState(
      running: session.running,
      startedAt: session.endsAt.addingTimeInterval(-Double(max(session.totalSec, 1))),
      endsAt: session.endsAt,
      remainingSec: session.remainingSec
    )
    // Stale at the moment the clock runs out. The system redraws then, with the
    // app asleep, which is how the Lock Screen gets to say "Time's up" by itself.
    let content = ActivityContent(state: state, staleDate: session.running ? session.endsAt : nil)

    // The title and first move can't change on a running activity, so one showing
    // a different task is ended and a new one takes its place.
    var kept: Activity<FocusAttributes>?
    for activity in Activity<FocusAttributes>.activities {
      let same =
        activity.attributes.title == session.title
        && activity.attributes.firstStep == session.firstStep
      let showing = activity.activityState == .active || activity.activityState == .stale
      if same && showing && kept == nil {
        kept = activity
      } else {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }

    if let kept = kept {
      await kept.update(content)
      return
    }
    do {
      _ = try Activity<FocusAttributes>.request(
        attributes: FocusAttributes(title: session.title, firstStep: session.firstStep),
        content: content,
        pushType: nil
      )
    } catch {
      // Too many activities, or the app isn't in front. The timer and its
      // notification don't depend on this, so the session carries on without it.
    }
  }

  static func end() async {
    for activity in Activity<FocusAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}
#endif
