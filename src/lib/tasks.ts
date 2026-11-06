import { format } from 'date-fns'
import { addDays } from './points'
import { Cat } from './theme'
import { Task } from './types'

/** Plenty for a task, and short enough to keep every layout honest. */
export const MAX_TITLE = 200

export interface Buckets {
  inbox: Task[]
  today: Task[]
  later: Task[]
}

/** Whether a sorted task belongs on the Today list. */
export function isOnToday(t: Task, today: string): boolean {
  return t.bucket === 'today' || (t.bucket === 'later' && t.due === today)
}

/**
 * Sort tasks into the three lists.
 *
 * A Later task joins Today on the day it falls due. That's derived rather than
 * written back, so nothing has to run at midnight and the task keeps its real
 * bucket if the date moves. Overdue Later tasks deliberately stay put: after a
 * few days away, the Today list should not greet you with everything you missed.
 */
export function splitBuckets(tasks: Task[], today: string): Buckets {
  const out: Buckets = { inbox: [], today: [], later: [] }
  for (const t of tasks) {
    if (t.bucket === 'inbox') out.inbox.push(t)
    else if (isOnToday(t, today)) out.today.push(t)
    else out.later.push(t)
  }
  return out
}

export function isOverdue(t: Task, today: string): boolean {
  return t.bucket !== 'inbox' && !!t.due && t.due < today
}

const CAT_RANK: Record<Cat, number> = { fire: 0, sprint: 1, grind: 2 }

/**
 * The order "Start one thing" offers tasks in. Choosing is its own executive cost,
 * so the app picks: anything due first, then urgent, then the quick wins that are
 * easiest to begin, then the deep work. Oldest first within a rank, so a new task
 * can't keep bumping an old one out of the spotlight.
 */
export function rankForStart(tasks: Task[], today: string): Task[] {
  const dueRank = (t: Task) => (t.due && t.due <= today ? t.due : '9999-99-99')
  return [...tasks].sort(
    (a, b) =>
      dueRank(a).localeCompare(dueRank(b)) ||
      CAT_RANK[a.cat ?? 'sprint'] - CAT_RANK[b.cat ?? 'sprint'] ||
      a.createdAt.localeCompare(b.createdAt)
  )
}

/** A day key as a Date at local noon, safely away from any clock change. */
export function noon(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

/** Whole days from one day key to another, negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((noon(to).getTime() - noon(from).getTime()) / 86400000)
}

export interface DueChip {
  text: string
  overdue: boolean
}

/** Short label for a date. Words nearby, a weekday within a week, then the date. */
export function dueChip(due: string, today: string): DueChip {
  const diff = daysBetween(today, due)
  const overdue = diff < 0
  if (diff === 0) return { text: 'Today', overdue }
  if (diff === 1) return { text: 'Tomorrow', overdue }
  if (diff === -1) return { text: 'Yesterday', overdue }
  if (Math.abs(diff) < 7) return { text: format(noon(due), 'EEE'), overdue }
  return { text: format(noon(due), 'MMM d'), overdue }
}

export interface QuickDate {
  label: string
  key: string
}

/** One-tap dates for the task editor. Sized so most tasks never need a calendar. */
export function quickDates(today: string): QuickDate[] {
  const dow = noon(today).getDay() // 0 Sunday … 6 Saturday
  const out: QuickDate[] = [
    { label: 'Today', key: today },
    { label: 'Tomorrow', key: addDays(today, 1) },
  ]
  // Monday to Thursday only. On a Friday it's just "tomorrow" under another name.
  if (dow >= 1 && dow <= 4) out.push({ label: 'This weekend', key: addDays(today, 6 - dow) })
  out.push({ label: 'Next week', key: addDays(today, dow === 0 ? 8 : 8 - dow) })
  return out
}
