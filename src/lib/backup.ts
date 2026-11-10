import { MAX_TITLE } from './tasks'
import { Cat } from './theme'
import { Bucket, Completion, Task } from './types'

/**
 * Reading an export back in.
 *
 * An export nobody can restore is a receipt, not a backup. This is the other
 * half: paste what "Export my data" produced and it's merged into what's here.
 *
 * Two rules, both about being safe to tap without thinking:
 * - It only ever adds. Nothing on the phone is overwritten or removed, so a
 *   restore can't cost anything, and doing it twice does nothing the second time.
 * - It trusts nothing. The text has been through a share sheet and probably a
 *   notes app, and could be an export from a different version. Each entry is
 *   rebuilt from the fields this version knows, and one that doesn't make sense
 *   is left out rather than failing the lot.
 */

export interface Backup {
  tasks: Task[]
  history: Completion[]
}

const CATS: Cat[] = ['sprint', 'fire', 'grind']
const BUCKETS: Bucket[] = ['inbox', 'today', 'later']
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/
/** the longest a session can run, so no restored entry can claim more */
const MAX_MINUTES = 180

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined
const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isCat = (v: unknown): v is Cat => CATS.includes(v as Cat)
const dayKey = (v: unknown): string | undefined =>
  typeof v === 'string' && DAY_KEY.test(v) ? v : undefined

function readTask(v: unknown): Task | null {
  if (!isRecord(v)) return null
  const id = text(v.id, 80)
  const title = text(v.title, MAX_TITLE)
  if (!id || !title || !BUCKETS.includes(v.bucket as Bucket) || !isDate(v.createdAt)) return null
  const task: Task = { id, title, bucket: v.bucket as Bucket, createdAt: v.createdAt }
  if (isCat(v.cat)) task.cat = v.cat
  const firstStep = text(v.firstStep, 120)
  if (firstStep) task.firstStep = firstStep
  const due = dayKey(v.due)
  if (due) task.due = due
  const source = text(v.source, 20)
  if (source) task.source = source
  const course = text(v.course, 80)
  if (course) task.course = course
  const externalId = text(v.externalId, 200)
  if (externalId) task.externalId = externalId
  const feedDue = dayKey(v.feedDue)
  if (feedDue) task.feedDue = feedDue
  return task
}

function readCompletion(v: unknown): Completion | null {
  if (!isRecord(v)) return null
  const id = text(v.id, 80)
  const title = text(v.title, MAX_TITLE)
  const minutes = typeof v.minutes === 'number' && Number.isFinite(v.minutes) ? v.minutes : NaN
  // a category this version doesn't have can't be scored, and a negative or
  // missing length isn't a session
  if (!id || !title || !isCat(v.cat) || !isDate(v.completedAt) || !(minutes >= 0)) return null
  return {
    id,
    title,
    cat: v.cat,
    points: typeof v.points === 'number' && Number.isFinite(v.points) ? Math.max(0, v.points) : 0,
    minutes: Math.min(MAX_MINUTES, Math.round(minutes)),
    completedAt: v.completedAt,
  }
}

/** The export's contents, or null if this text isn't one. */
export function parseBackup(raw: string): Backup | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    return null
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.history)) return null
  return {
    tasks: parsed.tasks.map(readTask).filter((t): t is Task => t !== null),
    history: parsed.history.map(readCompletion).filter((c): c is Completion => c !== null),
  }
}

export interface Merged extends Backup {
  addedTasks: number
  addedHistory: number
}

/**
 * What's here plus whatever the backup has that isn't. The lists come back
 * untouched, by identity, when there was nothing to add.
 */
export function mergeBackup(current: Backup, backup: Backup): Merged {
  const haveTasks = new Set(current.tasks.map((t) => t.id))
  const haveHistory = new Set(current.history.map((c) => c.id))
  const newTasks = backup.tasks.filter((t) => !haveTasks.has(t.id))
  const newHistory = backup.history.filter((c) => !haveHistory.has(c.id))
  return {
    tasks: newTasks.length ? [...current.tasks, ...newTasks] : current.tasks,
    history: newHistory.length
      ? [...current.history, ...newHistory].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      : current.history,
    addedTasks: newTasks.length,
    addedHistory: newHistory.length,
  }
}
