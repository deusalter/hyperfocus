import { Cat } from './theme'

export type Bucket = 'inbox' | 'today' | 'later'

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
  /** external sync source, e.g. 'canvas' */
  source?: string
  course?: string
  createdAt: string
}

/**
 * The permanent record — one entry per finished task or focus session.
 * Everything historical (day points, streaks, insights, the yesterday
 * baseline the race runs against) derives from this log.
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
  /** gentle mode — hide streak pressure entirely */
  gentle: boolean
  reminders: boolean
  sounds: boolean
  onboarded: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  focusLen: 25,
  gentle: false,
  reminders: true,
  sounds: false,
  onboarded: false,
}
