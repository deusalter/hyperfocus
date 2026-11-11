import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'
import { RaceField } from './points'
import { raceHeadline } from './raceCopy'
import { FocusSession, remainingSec } from './session'

/**
 * The Lock Screen Live Activity for a running session, and the data behind the
 * Home Screen widget. Both are drawn by a widget extension written in Swift
 * (`targets/widgets`). This is the app's side of it.
 *
 * Why they exist: the app did nothing until someone remembered to open it, which
 * is the exact thing it's meant to help with. A timer that's only visible inside
 * its own app stops helping the moment you leave to do the work.
 *
 * Like the "time's up" notification, both calls say how things stand, not what
 * just happened, so calling one twice or after a restart can't leave the Lock
 * Screen showing something untrue. The store calls them. Nothing else should.
 *
 * iOS only, and only in a build that has the native module: on web, Android and in
 * tests the module isn't there and every call here does nothing.
 */

/** Shared by the app and the extension. Also in app.json and targets/widgets/WidgetState.swift. */
export const APP_GROUP = 'group.com.deusalter.hyperfocus'

interface ActivityPayload {
  title: string
  firstStep?: string
  running: boolean
  /** epoch ms */
  endsAt: number
  totalSec: number
  remainingSec: number
}

interface NativeFocusActivity {
  sync(session: ActivityPayload): void
  end(): void
  setWidgetState(json: string | null, group: string): void
}

const native =
  Platform.OS === 'ios' ? requireOptionalNativeModule<NativeFocusActivity>('FocusActivity') : null

/** What the task behind a session adds to it. The session only snapshots a title. */
export interface SessionTask {
  title?: string
  firstStep?: string
}

export function activityPayload(
  session: FocusSession,
  task: SessionTask | null | undefined,
  now: number
): ActivityPayload {
  const left = remainingSec(session, now)
  return {
    title: task?.title ?? session.title ?? 'One thing',
    firstStep: task?.firstStep?.trim() || undefined,
    running: session.running,
    // paused, there's no end time: this is when it would end if resumed right now,
    // which keeps "how far in" the same either way
    endsAt: session.running ? session.endsAt : now + left * 1000,
    totalSec: session.totalSec,
    remainingSec: left,
  }
}

/** Make the Live Activity match the session, or take it down when there isn't one. */
export function syncLiveActivity(session: FocusSession | null, task?: SessionTask | null): void {
  if (!native) return
  try {
    if (session) native.sync(activityPayload(session, task, Date.now()))
    else native.end()
  } catch (err) {
    // the timer and its notification don't depend on this
    console.warn('live activity sync failed:', err)
  }
}

/** Today's race for the wider widget, as Home's card draws it. */
export interface WidgetRace {
  points: number
  /** a typical recent day, 0 when there's nothing to race yet */
  pacer: number
  /** each recent active day's points */
  ghosts: number[]
  /** the headline Home's card leads with */
  line: string
  /** no field and no typical day, only today's own progress */
  gentle: boolean
}

export function widgetRace(race: RaceField, points: number, gentle: boolean): WidgetRace {
  return {
    points,
    // Gentle mode means no comparisons anywhere, and that includes the Home Screen.
    // The numbers aren't sent at all, so nothing can draw them by mistake.
    pacer: gentle ? 0 : race.pacer,
    ghosts: gentle ? [] : race.ghosts.map((g) => g.points),
    line: raceHeadline(race, points, gentle),
    gentle,
  }
}

/** What the widget draws from. Mirrors `WidgetState` in targets/widgets/WidgetState.swift. */
export interface WidgetState {
  /** the task Home would offer to start */
  title?: string
  firstStep?: string
  /** the usual session length, in minutes */
  focusLen: number
  /** set only while a session is running */
  sessionTitle?: string
  /** epoch ms */
  sessionEndsAt?: number
  race?: WidgetRace
}

export function widgetState(
  next: SessionTask | null | undefined,
  focusLen: number,
  session: FocusSession | null,
  sessionTitle?: string,
  race?: WidgetRace
): WidgetState {
  const state: WidgetState = { focusLen }
  if (race) state.race = race
  if (next?.title) state.title = next.title
  const step = next?.firstStep?.trim()
  if (step) state.firstStep = step
  // A paused session has no end to count down to, so the widget goes back to
  // offering the task. The Live Activity is what shows a pause.
  if (session?.running) {
    state.sessionTitle = sessionTitle ?? session.title ?? 'One thing'
    state.sessionEndsAt = session.endsAt
  }
  return state
}

/** Hand the widget what it should show and have it redraw. */
export function syncWidget(state: WidgetState): void {
  if (!native) return
  try {
    native.setWidgetState(JSON.stringify(state), APP_GROUP)
  } catch (err) {
    console.warn('widget sync failed:', err)
  }
}
