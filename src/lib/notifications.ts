import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { FocusSession } from './session'
import { NudgeTask, planReminders } from './reminders'

/**
 * Every notification here is local: scheduled on the device, with no server and
 * no push token involved.
 */

const SUPPORTED = Platform.OS !== 'web'
const SESSION_ID = 'session-end'
const REMINDER_PREFIX = 'reminder-'

if (SUPPORTED) {
  // With the app open it marks the moment itself with a haptic and the recap, so
  // a banner on top would just be saying the same thing twice. The sound is a
  // different matter. A session mostly ends with the phone lying on the desk and
  // eyes on something else, where a buzz goes unfelt and a screen changing goes
  // unseen, and a timer nobody notices ending isn't keeping time for anyone. So
  // the end of a session keeps its sound, at whatever the phone's ringer allows.
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: notification.request.identifier === SESSION_ID,
      shouldSetBadge: false,
    }),
  })
}

/** Ask if we haven't yet. Resolves to whether we're allowed to notify. */
export async function requestNotifications(): Promise<boolean> {
  if (!SUPPORTED) return false
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return true
    if (!current.canAskAgain) return false
    const next = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    })
    return next.granted
  } catch (err) {
    console.warn('notification permission failed:', err)
    return false
  }
}

/** Whether notifications can reach the user right now. Never prompts. */
export async function notificationsAllowed(): Promise<boolean> {
  if (!SUPPORTED) return true
  try {
    return (await Notifications.getPermissionsAsync()).granted
  } catch {
    return true
  }
}

// A later call supersedes an earlier one still awaiting. Pause then resume in
// quick succession must not leave the stale schedule standing.
let sessionRun = 0

/** Make the scheduled "time's up" match the session, whatever state it's in. */
export async function syncSessionAlert(session: FocusSession | null): Promise<void> {
  if (!SUPPORTED) return
  const run = ++sessionRun
  try {
    await Notifications.cancelScheduledNotificationAsync(SESSION_ID)
    if (!session?.running || session.endsAt <= Date.now()) return
    const { granted } = await Notifications.getPermissionsAsync()
    if (!granted || run !== sessionRun) return
    const minutes = Math.round(session.totalSec / 60)
    await Notifications.scheduleNotificationAsync({
      identifier: SESSION_ID,
      content: {
        title: "Time's up",
        body: session.title
          ? `${minutes} minutes on "${session.title}". That counted.`
          : `${minutes} minutes in. That counted.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(session.endsAt),
      },
    })
  } catch (err) {
    console.warn('session alert failed:', err)
  }
}

let reminderRun = 0

/** Rebuild the week of nudges. See reminders.ts for why it's a week at a time. */
export async function syncReminders(
  hour: number | null,
  activeToday: boolean,
  next?: NudgeTask | null
): Promise<void> {
  if (!SUPPORTED) return
  const run = ++reminderRun
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    )
    if (hour == null) return
    const { granted } = await Notifications.getPermissionsAsync()
    if (!granted || run !== reminderRun) return
    await Promise.all(
      planReminders(new Date(), hour, activeToday, next).map((r, i) =>
        Notifications.scheduleNotificationAsync({
          identifier: `${REMINDER_PREFIX}${i}`,
          content: { title: r.title, body: r.body },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
        })
      )
    )
  } catch (err) {
    console.warn('reminder sync failed:', err)
  }
}

export async function clearAllNotifications(): Promise<void> {
  if (!SUPPORTED) return
  sessionRun++
  reminderRun++
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
}
