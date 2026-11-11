// Writes an AsyncStorage manifest for a simulator, so a run can open on realistic
// data instead of tapping its way there. iOS keeps AsyncStorage as one JSON file of
// key to string value, and reads a value from there whatever its size.
//
//   node scripts/sim-seed.mjs [full|fresh-start|gentle|away|store-*] > manifest.json

import { HISTORY, TASKS, dayKey, daysFromNow, runningSession, seed } from './seed.mjs'

const kind = process.argv[2] ?? 'full'

const earlierToday = (...items) =>
  items.map(([title, cat, minutes], i) => ({
    id: `today${i}`,
    title,
    cat,
    points: 0,
    minutes,
    completedAt: daysFromNow(0, 8).toISOString(),
  }))

const states = {
  full: () => seed(),
  // ---- the states the store screenshots show ----
  'store-home': () =>
    seed({ history: [...earlierToday(['Laundry', 'sprint', 0], ['Reply to coach', 'sprint', 0]), ...HISTORY()] }),
  'store-focus': () =>
    seed({
      focus: runningSession('t1', 'Draft intro for history essay', 'grind', { leftMs: 17 * 60 * 1000 }),
      settings: { sound: 'brown' },
    }),
  'store-dump': () =>
    seed({
      tasks: ['Text Maya back', 'Look up dentist hours', 'Return the library books', 'Figure out summer job thing', 'Buy shampoo'].map(
        (title, i) => ({ id: `i${i}`, title, bucket: 'inbox', createdAt: daysFromNow(0, 7).toISOString() })
      ),
    }),
  // a full session with moments to spare, on a day that passes typical
  'store-recap': () =>
    seed({
      focus: runningSession('t3', 'Clear the desk', 'sprint', { leftMs: 90 * 1000 }),
      history: [...earlierToday(['Reply to coach', 'fire', 15]), ...HISTORY()],
    }),
  'store-calendar': () =>
    seed({
      tasks: [
        ...TASKS(),
        {
          id: 'c1',
          title: 'Reading response 4',
          cat: 'grind',
          bucket: 'later',
          due: dayKey(daysFromNow(0)),
          feedDue: dayKey(daysFromNow(0)),
          course: 'ENGL 1A',
          source: 'canvas',
          externalId: 'event-assignment-2',
          createdAt: daysFromNow(-4).toISOString(),
        },
      ],
    }),
  // no first move written down yet, so Focus offers to help name one
  'fresh-start': () => seed({ tasks: TASKS().map(({ firstStep, ...task }) => task) }),
  gentle: () => seed({ settings: { gentle: true } }),
  // back after nine days, with something overdue that should stay out of the way
  away: () =>
    seed({
      history: [
        {
          id: 'h',
          title: 'Old',
          cat: 'sprint',
          points: 0,
          minutes: 0,
          completedAt: daysFromNow(-9).toISOString(),
        },
      ],
    }),
  // A session with long enough left to launch and lock the phone, and little
  // enough that waiting it out doesn't take the whole job. Eighty seconds wasn't
  // enough on a slow runner: the app opened straight onto the recap.
  'lock-expiring': () =>
    seed({ focus: runningSession('t3', 'Clear the desk', 'sprint', { leftMs: 150 * 1000 }) }),
}

const data = states[kind]()
const manifest = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]))
process.stdout.write(JSON.stringify(manifest))
