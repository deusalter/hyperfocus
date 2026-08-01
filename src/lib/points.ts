import { CATS, Cat } from './theme'
import { Completion } from './types'

/** Points for finishing a task after `minutes` of focus (0 = direct check-off). */
export function scoreCompletion(cat: Cat, minutes: number): number {
  const m = CATS[cat]
  return m.base + m.rate * minutes
}

/**
 * How many things fit on a Today list.
 *
 * Decision time climbs with the number of options, and a triage step that can
 * push fifteen items into Today just rebuilds the pile it was meant to clear.
 * Soft on purpose — going over is allowed and only ever shows a note. Silently
 * overriding a choice the user just made trades one problem for a worse one.
 */
export const TODAY_CAP = 5

/** How long something sits in Later before it's worth asking about again. */
export const STALE_DAYS = 21

/** Days away before the app treats a return as a return. */
export const AWAY_DAYS = 3

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
    // Bucket by *local* day. completedAt is an ISO-8601 UTC stamp, so slicing
    // its date prefix files an 8pm PDT session under tomorrow — the points
    // exist but land on a day the UI never asks about, and the whole evening
    // silently stops counting.
    const key = dayKey(new Date(c.completedAt))
    const day = map.get(key) ?? { ...EMPTY_DAY }
    day.points += c.points
    day.completed += 1
    day.minutes += c.minutes
    map.set(key, day)
  }
  return map
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface Ghost {
  day: string
  /** 'Tue', or 'Yesterday' for the immediately preceding day */
  label: string
  points: number
  /** true once today's total has gone past this day */
  passed: boolean
}

export interface RaceField {
  /** recent active days, weakest first so the track reads left→right */
  ghosts: Ghost[]
  /** the target: a typical day for you. Never your best — see below. */
  pacer: number
  /** how many ghosts today has already gone past */
  passed: number
  /** today has matched a typical day */
  ahead: boolean
  /** personal best — celebrated, never used as a bar to clear */
  best: number
  /** false on a fresh start: nothing to race yet */
  hasField: boolean
}

/** How far back the field is drawn from, and how many runners it holds. */
const FIELD_LOOKBACK = 14
const FIELD_SIZE = 7

/**
 * The field you race today.
 *
 * Deliberately *not* "yesterday" or "your best". Racing a single previous day
 * ratchets: every good day raises a bar you must then clear, so success
 * guarantees a later failure and the loss lands hardest right after you did
 * well. Racing a crowd instead gives graded credit — you pass some runners on
 * almost any day — and the pacer is the median of your recent active days, so
 * one enormous Tuesday can't set an unreachable target.
 */
export function buildRaceField(
  byDay: Map<string, DayTotals>,
  today: string,
  todayPoints: number
): RaceField {
  const recent: { day: string; points: number }[] = []
  for (let back = 1; back <= FIELD_LOOKBACK && recent.length < FIELD_SIZE; back++) {
    const key = addDays(today, -back)
    const totals = byDay.get(key)
    if (totals && totals.points > 0) recent.push({ day: key, points: totals.points })
  }

  if (recent.length === 0) {
    return { ghosts: [], pacer: 0, passed: 0, ahead: false, best: 0, hasField: false }
  }

  const sorted = [...recent].sort((a, b) => a.points - b.points)
  const mid = Math.floor(sorted.length / 2)
  const pacer =
    sorted.length % 2 === 1
      ? sorted[mid].points
      : Math.round((sorted[mid - 1].points + sorted[mid].points) / 2)

  const yesterday = addDays(today, -1)
  const ghosts: Ghost[] = sorted.map((r) => ({
    day: r.day,
    label:
      r.day === yesterday ? 'Yesterday' : DOW[new Date(`${r.day}T12:00:00`).getDay()],
    points: r.points,
    passed: todayPoints >= r.points,
  }))

  return {
    ghosts,
    pacer,
    passed: ghosts.filter((g) => g.passed).length,
    ahead: todayPoints > 0 && todayPoints >= pacer,
    best: Math.max(...recent.map((r) => r.points)),
    hasField: true,
  }
}

/**
 * Days you showed up, out of the last 28.
 *
 * Not consecutive — a single miss shouldn't zero anything. Habit-formation
 * work finds missing one opportunity doesn't meaningfully affect the
 * trajectory, so a counter that resets on a miss contradicts the science it
 * claims to implement. This only ever goes up within its window.
 */
export const SHOWED_UP_WINDOW = 28

export function showedUpCount(byDay: Map<string, DayTotals>, today: string): number {
  let n = 0
  for (let back = 0; back < SHOWED_UP_WINDOW; back++) {
    if (byDay.has(addDays(today, -back))) n += 1
  }
  return n
}

/**
 * Days since the last active day, or null if today counts or there's no
 * history at all. Drives the coming-back-after-a-gap surface: the screen shown
 * after an absence is the one that decides whether the app gets reopened
 * again, so it needs to show zero accumulated debt.
 */
export function daysAway(byDay: Map<string, DayTotals>, today: string): number | null {
  if (byDay.has(today)) return null
  for (let back = 1; back <= 90; back++) {
    if (byDay.has(addDays(today, -back))) return back
  }
  return null
}

export interface WeekSummary {
  points: number
  completed: number
  minutes: number
  activeDays: number
  /** the strongest day in the window, for a concrete callback */
  bestLabel: string | null
  bestPoints: number
}

/**
 * What the last `span` days actually contained.
 *
 * Deliberately all totals and no streaks: the debrief's job is to close a
 * period by counting what happened, not to grade it. Temporal landmarks
 * motivate by putting past imperfections in a finished accounting period —
 * that only works if the summary leads with what you did.
 */
export function summarize(
  byDay: Map<string, DayTotals>,
  today: string,
  span = 7
): WeekSummary {
  let points = 0
  let completed = 0
  let minutes = 0
  let activeDays = 0
  let bestPoints = 0
  let bestLabel: string | null = null
  for (let back = 0; back < span; back++) {
    const key = addDays(today, -back)
    const d = byDay.get(key)
    if (!d) continue
    points += d.points
    completed += d.completed
    minutes += d.minutes
    activeDays += 1
    if (d.points > bestPoints) {
      bestPoints = d.points
      bestLabel = back === 0 ? 'Today' : DOW[new Date(`${key}T12:00:00`).getDay()]
    }
  }
  return { points, completed, minutes, activeDays, bestLabel, bestPoints }
}

/**
 * How long a task has been sitting, in whole days.
 *
 * Both sides are pinned to local noon before subtracting so a DST shift can't
 * round a boundary the wrong way.
 */
export function ageInDays(createdAt: string, today: string): number {
  const made = new Date(createdAt)
  const from = new Date(`${dayKey(made)}T12:00:00`).getTime()
  const to = new Date(`${today}T12:00:00`).getTime()
  return Math.max(0, Math.round((to - from) / 86400000))
}

export interface WeekBar {
  key: string
  label: string
  points: number
  isToday: boolean
}

/** Last 7 days of momentum, oldest first, today last. */
export function weekBars(byDay: Map<string, DayTotals>, today: string): WeekBar[] {
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
  // no trailing punctuation — a name gets appended after this
  if (h < 5) return 'Still up'
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
