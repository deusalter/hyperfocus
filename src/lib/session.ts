import { Cat } from './theme'
import { Task } from './types'

export interface FocusSession {
  taskId: string
  /**
   * Snapshots, not lookups. A session outlives its task if the task gets let go
   * or checked off mid-run, and the record of those minutes still needs a name.
   * Optional because sessions saved before this field existed can be restored.
   */
  title?: string
  cat?: Cat
  totalSec: number
  running: boolean
  /** epoch ms the session ends at (while running) */
  endsAt: number
  /** seconds left, snapshotted when paused */
  pausedRemaining: number
}

/**
 * How long a run-out session can sit before it stops deserving a recap.
 * Past this it's banked quietly: nobody wants to be congratulated on opening the
 * app for a session they started three days ago and forgot about.
 */
export const STALE_SESSION_MS = 12 * 60 * 60 * 1000

/** Longest a session can be stretched to. */
const MAX_SESSION_SEC = 3 * 60 * 60

/** A cut can't leave less than this on the clock. */
const MIN_LEFT_SEC = 60

export function newSession(
  task: Pick<Task, 'id' | 'title' | 'cat'>,
  minutes: number,
  now: number
): FocusSession {
  const totalSec = minutes * 60
  return {
    taskId: task.id,
    title: task.title,
    cat: task.cat ?? 'sprint',
    totalSec,
    running: true,
    endsAt: now + totalSec * 1000,
    pausedRemaining: totalSec,
  }
}

export function remainingSec(s: FocusSession, now: number): number {
  return s.running ? Math.max(0, Math.round((s.endsAt - now) / 1000)) : s.pausedRemaining
}

export function pauseSession(s: FocusSession, now: number): FocusSession {
  return { ...s, running: false, pausedRemaining: remainingSec(s, now) }
}

export function resumeSession(s: FocusSession, now: number): FocusSession {
  return { ...s, running: true, endsAt: now + s.pausedRemaining * 1000 }
}

/** Minutes to credit. At least one: starting is the thing being rewarded. */
export function focusedMinutes(s: FocusSession, now: number): number {
  return Math.max(1, Math.round((s.totalSec - remainingSec(s, now)) / 60))
}

/**
 * Add or take away time. Returns the session unchanged if the change isn't
 * allowed, so a caller can compare identity to know whether anything happened.
 */
export function adjustSession(s: FocusSession, deltaMin: number, now: number): FocusSession {
  const delta = deltaMin * 60
  const left = remainingSec(s, now)
  const nextLeft = left + delta
  const nextTotal = s.totalSec + delta
  if (nextLeft < MIN_LEFT_SEC || nextTotal > MAX_SESSION_SEC) return s
  return s.running
    ? { ...s, totalSec: nextTotal, endsAt: s.endsAt + delta * 1000 }
    : { ...s, totalSec: nextTotal, pausedRemaining: nextLeft }
}

export function hasExpired(s: FocusSession, now: number): boolean {
  return s.running && now >= s.endsAt
}

export function isStaleExpired(s: FocusSession, now: number): boolean {
  return s.running && now - s.endsAt > STALE_SESSION_MS
}

/**
 * When a session actually finished. If the clock ran out while the app was
 * closed, the credit belongs to when it ran out. Stamping "now" would file last
 * night's session under this morning.
 */
export function completedStamp(s: FocusSession, now: number): string {
  return new Date(s.running ? Math.min(now, s.endsAt) : now).toISOString()
}
