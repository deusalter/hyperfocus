import { AppearanceMode } from './appearance'
import { Cat } from './theme'

export type Bucket = 'inbox' | 'today' | 'later'

export type SoundKind = 'off' | 'brown' | 'pink' | 'waves'

export interface Task {
  id: string
  title: string
  /** unset while sitting in the inbox — assigned at triage */
  cat?: Cat
  bucket: Bucket
  /** tiny first step to beat initiation paralysis */
  firstStep?: string
  /** YYYY-MM-DD — puts the task on the calendar + debrief */
  due?: string
  /** where it came from when it wasn't typed in: 'canvas' or 'feed' */
  source?: string
  course?: string
  /** the feed's own id, so a re-sync updates this task instead of duplicating it */
  externalId?: string
  /**
   * The date the feed last gave. Kept apart from `due`, which is the user's to
   * change: a sync only touches `due` when this moves, meaning the school moved
   * the deadline, and otherwise leaves a rescheduled task alone.
   */
  feedDue?: string
  createdAt: string
}

/**
 * The permanent record — one entry per finished task or focus session.
 * Everything historical (day points, showing up, insights, the field of recent
 * days the race runs against) derives from this log.
 */
export interface Completion {
  id: string
  title: string
  cat: Cat
  points: number
  /** focused minutes attached to this completion (0 = checked off directly) */
  minutes: number
  completedAt: string
}

export interface Settings {
  name: string
  /** default focus length in minutes */
  focusLen: number
  /** no comparisons anywhere: hides the race field, day counts and week-over-week */
  gentle: boolean
  /** hour of day for the daily nudge, null when off */
  reminderHour: number | null
  /** plays during a focus session */
  sound: SoundKind
  /** light by default. See appearance.ts */
  appearance: AppearanceMode
  /** subscribed calendar link. Stays on the device. */
  feedUrl: string | null
  feedSyncedAt: number | null
  onboarded: boolean
  /** the system review prompt has been requested once */
  reviewAsked: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  focusLen: 25,
  gentle: false,
  reminderHour: null,
  sound: 'off',
  appearance: 'light',
  feedUrl: null,
  feedSyncedAt: null,
  onboarded: false,
  reviewAsked: false,
}

/** Stored settings over defaults, dropping keys from earlier versions. */
export function loadSettings(stored: Partial<Settings> & Record<string, unknown>): Settings {
  const out = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (stored[key] !== undefined) (out as Record<string, unknown>)[key] = stored[key]
  }
  return out
}
