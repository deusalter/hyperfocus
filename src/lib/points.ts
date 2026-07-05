import { CATS, Cat } from './theme'
import { Completion } from './types'

/** Points for finishing a task after `minutes` of focus (0 = direct check-off). */
export function scoreCompletion(cat: Cat, minutes: number): number {
  const m = CATS[cat]
  return m.base + m.rate * minutes
}

/** Companion level — every 35 pts of a day's momentum grows it one step. */
export const PTS_PER_LEVEL = 35

export function levelForPoints(points: number): number {
  return Math.floor(points / PTS_PER_LEVEL)
}

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return dayKey(d)
}

export interface DayTotals {
  points: number
  completed: number
  minutes: number
}

const EMPTY_DAY: DayTotals = { points: 0, completed: 0, minutes: 0 }

export function totalsByDay(history: Completion[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>()
  for (const c of history) {
    const key = c.completedAt.slice(0, 10)
    const day = map.get(key) ?? { ...EMPTY_DAY }
    day.points += c.points
    day.completed += 1
    day.minutes += c.minutes
    map.set(key, day)
  }
  return map
}

/**
 * The pace-marker baseline: yesterday's totals, or — so a single day off
 * doesn't erase the companion — the most recent active day in the last week.
 * Null on a fresh start (the race card shows a welcome instead).
 */
export function pickBaseline(
  byDay: Map<string, DayTotals>,
  today: string
): { day: string; totals: DayTotals } | null {
  for (let back = 1; back <= 7; back++) {
    const key = addDays(today, -back)
    const totals = byDay.get(key)
    if (totals && totals.points > 0) return { day: key, totals }
  }
  return null
}

/** Consecutive days (ending today or yesterday) with any completion. */
export function showedUpStreak(byDay: Map<string, DayTotals>, today: string): number {
  let anchor = today
  if (!byDay.has(anchor)) {
    anchor = addDays(today, -1)
    if (!byDay.has(anchor)) return 0
  }
  let streak = 0
  let cursor = anchor
  while (byDay.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export interface WeekBar {
  key: string
  label: string
  points: number
  isToday: boolean
}

/** Last 7 days of momentum, oldest first, today last. */
export function weekBars(byDay: Map<string, DayTotals>, today: string): WeekBar[] {
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bars: WeekBar[] = []
  for (let back = 6; back >= 0; back--) {
    const key = addDays(today, -back)
    const d = new Date(`${key}T12:00:00`)
    bars.push({
      key,
      label: back === 0 ? 'Today' : DOW[d.getDay()],
      points: byDay.get(key)?.points ?? 0,
      isToday: back === 0,
    })
  }
  return bars
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${`${s}`.padStart(2, '0')}`
}
