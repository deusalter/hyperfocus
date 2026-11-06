import { addDays, dayKey } from './points'
import { MAX_TITLE } from './tasks'
import { Task } from './types'
import { generateId } from './utils'

/**
 * Calendar feeds: a subscribed .ics link, read directly by the phone.
 *
 * Canvas publishes one per student with no login or API key, so this is how
 * assignments get in without a server, an account, or any data passing through
 * anyone but the school. The same code reads Google or Outlook feeds.
 */

/**
 * How far ahead to import. Connecting a feed should not dump a whole semester
 * onto someone who already struggles with piles, so it fills in as dates approach.
 */
export const FEED_WINDOW_DAYS = 30

/** Re-read the feed when the app opens, at most this often. */
export const FEED_REFRESH_MS = 6 * 60 * 60 * 1000

/** Ids remembered so finished work stays gone. Bounded so it can't grow forever. */
const MAX_SEEN = 3000

const FETCH_TIMEOUT_MS = 15000

export interface FeedEvent {
  uid: string
  summary: string
  /** the local calendar day, YYYY-MM-DD */
  date: string
}

const ESCAPES: Record<string, string> = { n: ' ', N: ' ', ',': ',', ';': ';', '\\': '\\' }

/** One pass, so an escaped backslash followed by an n isn't read as a line break. */
function unescapeText(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, c: string) => ESCAPES[c]).trim()
}

/** DTSTART value → local day. UTC times convert; everything else keeps its written date. */
function parseDate(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s, utc] = m
  // A malformed feed can say November 31st. Stored, that date throws every time
  // the task renders, so it has to be stopped here.
  const real = new Date(+y, +mo - 1, +d)
  if (real.getMonth() !== +mo - 1 || real.getDate() !== +d) return null
  if (utc) {
    return dayKey(new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)))
  }
  return `${y}-${mo}-${d}`
}

/** The colon ending a property name, ignoring any inside quoted parameters. */
function nameEnd(line: string): number {
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted
    else if (line[i] === ':' && !quoted) return i
  }
  return -1
}

export function parseIcs(text: string): FeedEvent[] {
  // RFC 5545 folds long lines by starting the continuation with a space or tab
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const events: FeedEvent[] = []
  let current: (Partial<FeedEvent> & { cancelled?: boolean; instance?: string }) | null = null
  // Components nested in an event, like an alarm, have a SUMMARY and UID of their
  // own. Google's say "Alarm notification", which is no name for a task.
  let nested = 0

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper === 'BEGIN:VEVENT') {
      current = {}
      nested = 0
    } else if (!current) {
      continue
    } else if (upper === 'END:VEVENT') {
      if (current.uid && current.summary && current.date && !current.cancelled) {
        events.push({
          // an edited instance of a series shares the series' UID, and left that
          // way the two would fight over one task on every sync
          uid: current.instance ? `${current.uid}#${current.instance}` : current.uid,
          summary: current.summary,
          date: current.date,
        })
      }
      current = null
    } else if (upper.startsWith('BEGIN:')) {
      nested += 1
    } else if (upper.startsWith('END:')) {
      nested = Math.max(0, nested - 1)
    } else if (nested === 0) {
      const end = nameEnd(line)
      if (end < 0) continue
      const name = upper.slice(0, end).split(';')[0]
      const value = line.slice(end + 1)
      if (name === 'UID') current.uid = value.trim()
      else if (name === 'SUMMARY') current.summary = unescapeText(value)
      else if (name === 'DTSTART') current.date = parseDate(value) ?? undefined
      else if (name === 'RECURRENCE-ID') current.instance = value.trim()
      else if (name === 'STATUS') current.cancelled = value.trim().toUpperCase() === 'CANCELLED'
    }
  }
  return events
}

/** Canvas writes titles as "Essay 3 draft [ENGL 1A Section 4]". */
export function splitCourse(summary: string): { title: string; course?: string } {
  const m = /^(.*\S)\s*\[([^\]]+)\]$/.exec(summary.trim())
  return m ? { title: m[1], course: m[2].trim() } : { title: summary.trim() }
}

/** A usable https link, or null. webcal:// is the same thing under another scheme. */
export function normalizeFeedUrl(raw: string): string | null {
  const url = raw.trim().replace(/^webcal:\/\//i, 'https://')
  if (!/^https:\/\/\S+\.\S+$/i.test(url)) return null
  return url
}

/**
 * Canvas's own feed path, plus its hosted domain. Schools on their own domains
 * still use that path, and plenty of unrelated links contain the word "canvas".
 */
export function isCanvasUrl(url: string): boolean {
  return /\.instructure\.com\//i.test(url) || /\/feeds\/calendars\/user_/i.test(url)
}

export interface MergeInput {
  tasks: Task[]
  seen: string[]
  events: FeedEvent[]
  today: string
  now: number
  url: string
}

export interface MergeResult {
  tasks: Task[]
  seen: string[]
  added: number
  updated: number
}

/**
 * Fold a fresh read of the feed into the task list.
 *
 * Everything imported lands in Later. It reaches Today on its own on the day it's
 * due, and a date in the past is ignored outright: connecting a feed must never
 * open with a backlog. `seen` is what keeps finished or released work from coming
 * back on the next sync, since the feed itself has no idea what you've done.
 */
export function mergeFeed({ tasks, seen, events, today, now, url }: MergeInput): MergeResult {
  const canvas = isCanvasUrl(url)
  const horizon = addDays(today, FEED_WINDOW_DAYS)
  const seenSet = new Set(seen)
  const byExternal = new Map(tasks.filter((t) => t.externalId).map((t) => [t.externalId!, t]))

  const moved = new Map<string, string>()
  const fresh: Task[] = []

  for (const e of events) {
    // Canvas feeds mix in class meetings, which aren't something you can finish
    if (canvas && !e.uid.includes('assignment')) continue

    const existing = byExternal.get(e.uid)
    if (existing) {
      // The deadline moving is the one thing worth following. Compared against
      // what the feed said last time, not against `due`, or every sync would undo
      // a task the user rescheduled. Everything else about it is theirs too.
      if (existing.feedDue !== e.date) moved.set(existing.id, e.date)
      continue
    }
    if (seenSet.has(e.uid) || e.date < today || e.date > horizon) continue

    const { title, course } = splitCourse(e.summary)
    fresh.push({
      id: generateId(),
      title: title.slice(0, MAX_TITLE),
      course,
      cat: 'grind',
      bucket: 'later',
      due: e.date,
      feedDue: e.date,
      source: canvas ? 'canvas' : 'feed',
      externalId: e.uid,
      createdAt: new Date(now).toISOString(),
    })
    seenSet.add(e.uid)
  }

  const changed = fresh.length > 0 || moved.size > 0
  return {
    tasks: changed
      ? [
          ...fresh,
          ...tasks.map((t) => {
            const date = moved.get(t.id)
            return date ? { ...t, due: date, feedDue: date } : t
          }),
        ]
      : tasks,
    seen: fresh.length > 0 ? [...seenSet].slice(-MAX_SEEN) : seen,
    added: fresh.length,
    updated: moved.size,
  }
}

export type FeedError = 'unreachable' | 'not-a-calendar'

/** Read and parse a feed. Throws a FeedError string the UI can word properly. */
export async function fetchFeed(url: string): Promise<FeedEvent[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw 'unreachable' satisfies FeedError
    const text = await res.text()
    if (!text.includes('BEGIN:VCALENDAR')) throw 'not-a-calendar' satisfies FeedError
    return parseIcs(text)
  } catch (err) {
    if (err === 'not-a-calendar') throw err
    throw 'unreachable' satisfies FeedError
  } finally {
    clearTimeout(timer)
  }
}
