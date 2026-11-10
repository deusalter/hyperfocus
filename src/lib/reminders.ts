/**
 * The daily nudge: what to send and when.
 *
 * Three rules keep it from being a nag:
 * - At most one a day, and none on a day something has already been done.
 * - Scheduled a week at a time, refreshed whenever the app opens. Someone who
 *   hasn't opened it in a week stops hearing from it. Unanswered reminders that
 *   keep arriving are exactly the accumulating guilt this app exists to avoid.
 * - No counts, no "you missed", no streak talk. Each one is a small invitation.
 *
 * The next one names the task it's about. Remembering to do a thing at the right
 * moment is its own failure point, separate from wanting to, and "One small
 * thing?" hands the remembering straight back. So the soonest nudge says which
 * thing, and the first move if one's written down. Only the soonest: the ones
 * after it could arrive days later, about a task that's long finished.
 */

export const REMINDER_DAYS = 7

/** Stated as times. "Morning" leaves you guessing when to expect it. */
export const REMINDER_HOURS = [
  { hour: 9, label: '9 AM' },
  { hour: 13, label: '1 PM' },
  { hour: 18, label: '6 PM' },
  { hour: 20, label: '8 PM' },
] as const

const MESSAGES: { title: string; body: string }[] = [
  { title: 'One small thing?', body: 'Two minutes counts. Pick whatever is easiest.' },
  { title: 'Anything rattling around?', body: 'Dump it here and sort it later.' },
  { title: 'Nothing has piled up.', body: 'Start wherever you are, whenever you like.' },
  { title: 'Got five minutes?', body: 'Starting is the part that counts.' },
  { title: 'Your runner is around.', body: 'One finished thing moves it along.' },
]

export interface PlannedReminder {
  at: Date
  title: string
  body: string
}

/** The task a nudge can point at: whatever Home would offer to start. */
export interface NudgeTask {
  title: string
  firstStep?: string
}

/** Long enough for any real task, short enough for a banner's one line. */
const MAX_NUDGE_TITLE = 80

function named(task: NudgeTask): { title: string; body: string } {
  const title =
    task.title.length > MAX_NUDGE_TITLE ? `${task.title.slice(0, MAX_NUDGE_TITLE - 1).trimEnd()}…` : task.title
  return {
    title,
    body: task.firstStep
      ? `First move: ${task.firstStep}. Five minutes counts.`
      : 'Five minutes on it counts. Starting is the hard part.',
  }
}

export function planReminders(
  now: Date,
  hour: number,
  activeToday: boolean,
  next?: NudgeTask | null
): PlannedReminder[] {
  const plan: PlannedReminder[] = []
  const first = new Date(now)
  first.setHours(hour, 0, 0, 0)
  const skipToday = activeToday || first.getTime() <= now.getTime()
  const start = skipToday ? 1 : 0

  for (let i = 0; i < REMINDER_DAYS; i++) {
    const at = new Date(first)
    at.setDate(first.getDate() + start + i)
    // keyed to the calendar so a refresh doesn't reshuffle the words
    const n = Math.floor(at.getTime() / 86400000) % MESSAGES.length
    plan.push({ at, ...(i === 0 && next ? named(next) : MESSAGES[n]) })
  }
  return plan
}
