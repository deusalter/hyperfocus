// Writes an AsyncStorage manifest for a simulator, so a run can open on realistic
// data instead of tapping its way there. iOS keeps AsyncStorage as one JSON file of
// key to string value, and reads a value from there whatever its size.
//
//   node scripts/sim-seed.mjs [full|gentle|away] > manifest.json

import { daysFromNow, seed } from './seed.mjs'

const kind = process.argv[2] ?? 'full'

const states = {
  full: () => seed(),
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
}

const data = states[kind]()
const manifest = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]))
process.stdout.write(JSON.stringify(manifest))
