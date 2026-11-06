// Realistic app state for end-to-end checks and store screenshots. Written into
// localStorage, which is where AsyncStorage keeps things on web.

const pad = (n) => `${n}`.padStart(2, '0')
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Screenshots freeze the clock so the greeting and dates stay the same every run.
let frozen = null
export const freezeTime = (date) => {
  frozen = date
}
const now = () => (frozen ? new Date(frozen) : new Date())

export function daysFromNow(n, hour = 15) {
  const d = now()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d
}

const iso = (n, hour) => daysFromNow(n, hour).toISOString()

export const SETTINGS = {
  name: 'Sam',
  focusLen: 25,
  gentle: false,
  reminderHour: null,
  sound: 'off',
  feedUrl: null,
  feedSyncedAt: null,
  onboarded: true,
  reviewAsked: false,
}

export const TASKS = () => [
  {
    id: 't1',
    title: 'Draft intro for history essay',
    cat: 'grind',
    bucket: 'today',
    firstStep: 'open the doc and type one line',
    due: dayKey(daysFromNow(0)),
    createdAt: iso(-1),
  },
  { id: 't2', title: 'Email counselor about transcript', cat: 'fire', bucket: 'today', createdAt: iso(-2) },
  { id: 't3', title: 'Clear the desk', cat: 'sprint', bucket: 'today', createdAt: iso(0, 8) },
  { id: 't4', title: 'Renew library books', cat: 'sprint', bucket: 'later', createdAt: iso(-3) },
  {
    id: 't5',
    title: 'Physics problem set',
    cat: 'grind',
    bucket: 'later',
    due: dayKey(daysFromNow(3)),
    course: 'PHYS 2A',
    source: 'canvas',
    externalId: 'event-assignment-1',
    createdAt: iso(-5),
  },
  { id: 'i1', title: 'Text Maya back', bucket: 'inbox', createdAt: iso(0, 9) },
  { id: 'i2', title: 'Look up dentist hours', bucket: 'inbox', createdAt: iso(0, 9) },
]

// A believable few weeks: uneven, with gaps, and nothing heroic.
export const HISTORY = () => [
  [0, 'Morning review', 'sprint', 15],
  [1, 'Read chapter 4', 'grind', 25],
  [1, 'Laundry', 'sprint', 0],
  [2, 'Essay outline', 'grind', 25],
  [2, 'Call pharmacy', 'fire', 0],
  [3, 'Lab report', 'grind', 25],
  [3, 'Dishes', 'sprint', 0],
  [3, 'Quiz prep', 'fire', 15],
  [5, 'Math set', 'grind', 25],
  [6, 'Flashcards', 'sprint', 15],
  [8, 'Reading', 'grind', 15],
  [9, 'Clean room', 'sprint', 25],
  [10, 'Group project notes', 'fire', 15],
  [12, 'Math set', 'grind', 25],
].map(([n, title, cat, minutes], i) => ({
  id: `h${i}`,
  title,
  cat,
  points: 0,
  minutes,
  completedAt: iso(-n),
}))

export function runningSession(taskId, title, cat, { totalMin = 25, leftMs = 17 * 60 * 1000 } = {}) {
  return {
    taskId,
    title,
    cat,
    totalSec: totalMin * 60,
    running: true,
    endsAt: now().getTime() + leftMs,
    pausedRemaining: totalMin * 60,
  }
}

export function seed({ settings = {}, tasks, history, focus = null } = {}) {
  const out = {
    'hf2-settings': { ...SETTINGS, ...settings },
    'hf2-tasks': tasks ?? TASKS(),
    'hf2-history': history ?? HISTORY(),
  }
  if (focus) out['hf2-focus'] = focus
  return out
}
