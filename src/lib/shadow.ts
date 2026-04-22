import { DaySummary, FocusSession, Task, TaskType, TaskWeight } from './types'

// Type multipliers — deep work is worth more than admin. This is the whole
// point of task-model-v2: the shadow race isn't won by grinding emails.
const TYPE_MULT: Record<TaskType, number> = {
  deep: 1.5,
  creative: 1.3,
  admin: 1.0,
}

// Weight points — S=quick win, M=standard, L=big lift.
const WEIGHT_POINTS: Record<TaskWeight, number> = {
  S: 1,
  M: 3,
  L: 7,
}

export function taskScore(task: Task): number {
  const w = task.weight ?? 'M'
  const t = task.type ?? 'deep'
  return WEIGHT_POINTS[w] * TYPE_MULT[t]
}

function isoDay(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

/**
 * Collapse raw sessions + tasks into one DaySummary per calendar day.
 * Used both for "today's live score" and "shadow-self pick from history".
 */
export function buildDaySummaries(
  sessions: FocusSession[],
  tasks: Task[]
): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>()

  const getOrInit = (dateISO: string): DaySummary => {
    let day = map.get(dateISO)
    if (!day) {
      const date = new Date(dateISO + 'T00:00:00')
      day = {
        dateISO,
        dayOfWeek: date.getDay(),
        focusSeconds: 0,
        tasksCompleted: 0,
        score: 0,
        sessionStarts: [],
      }
      map.set(dateISO, day)
    }
    return day
  }

  for (const s of sessions) {
    const dateISO = isoDay(s.completedAt)
    const day = getOrInit(dateISO)
    day.focusSeconds += s.actualDuration
    // Sessions are stored by completedAt — back-compute start for the race timeline.
    const startISO = new Date(
      new Date(s.completedAt).getTime() - s.actualDuration * 1000
    ).toISOString()
    day.sessionStarts.push({ startISO, durationSec: s.actualDuration })
  }

  for (const t of tasks) {
    if (!t.completed || !t.completedAt) continue
    const dateISO = isoDay(t.completedAt)
    const day = getOrInit(dateISO)
    day.tasksCompleted += 1
    day.score += taskScore(t)
  }

  // Sort session starts within each day so timeline rendering is consistent.
  for (const day of map.values()) {
    day.sessionStarts.sort((a, b) => (a.startISO < b.startISO ? -1 : 1))
  }

  return map
}

/**
 * Pick the shadow for today. Prefers same-weekday-last-week (your Tuesday-self
 * races you this Tuesday), with fallbacks so there's always an opponent.
 */
export function pickShadow(
  today: Date,
  summaries: Map<string, DaySummary>
): DaySummary | null {
  const todayISO = isoDay(today)

  // 1. Same day-of-week, previous week
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  const lastWeekISO = isoDay(lastWeek)
  const lastWeekSame = summaries.get(lastWeekISO)
  if (lastWeekSame && lastWeekSame.focusSeconds > 0) return lastWeekSame

  // 2. Best day in the last 14 (by focus seconds)
  const cutoff = new Date(today)
  cutoff.setDate(today.getDate() - 14)
  let best: DaySummary | null = null
  for (const day of summaries.values()) {
    if (day.dateISO >= todayISO) continue
    if (day.dateISO < isoDay(cutoff)) continue
    if (!best || day.focusSeconds > best.focusSeconds) best = day
  }
  return best
}

/**
 * Delta between you-today and the shadow AT A SPECIFIC MOMENT IN TIME.
 * Shadow ticks on real wall-clock: if the shadow started their first session
 * at 9:04am on their day, they start counting today at 9:04am. This is what
 * creates the live-race pressure.
 */
export function shadowSecondsAt(
  shadow: DaySummary,
  now: Date
): number {
  // Project shadow's sessions onto today's timeline using HH:MM:SS from the
  // shadow day. E.g. shadow's session at "2026-04-15T09:04:23Z" means "today at 09:04:23 local".
  const nowMs = now.getTime()
  let total = 0

  for (const { startISO, durationSec } of shadow.sessionStarts) {
    const shadowStart = new Date(startISO)
    // Rebase to today while preserving local HH:MM:SS.
    const projected = new Date(now)
    projected.setHours(
      shadowStart.getHours(),
      shadowStart.getMinutes(),
      shadowStart.getSeconds(),
      0
    )
    const projectedStartMs = projected.getTime()
    const projectedEndMs = projectedStartMs + durationSec * 1000

    if (nowMs <= projectedStartMs) continue
    if (nowMs >= projectedEndMs) {
      total += durationSec
    } else {
      total += (nowMs - projectedStartMs) / 1000
    }
  }

  return Math.floor(total)
}

export function todayFocusSeconds(
  summaries: Map<string, DaySummary>,
  now: Date
): number {
  return summaries.get(isoDay(now))?.focusSeconds ?? 0
}
