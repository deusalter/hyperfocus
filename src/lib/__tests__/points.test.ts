import { Completion } from '../types'
import {
  FULL_VALUE_MIN,
  PTS_PER_LEVEL,
  addDays,
  ageInDays,
  buildRaceField,
  dayKey,
  daysAway,
  formatClock,
  greeting,
  levelForPoints,
  scoreCompletion,
  scoreParts,
  showedUpCount,
  summarize,
  totalsByDay,
  weekBars,
} from '../points'

function done(day: string, cat: Completion['cat'], minutes: number, hour = 15): Completion {
  return {
    id: `${day}-${cat}-${minutes}-${hour}`,
    title: 't',
    cat,
    points: 0,
    minutes,
    completedAt: new Date(`${day}T${`${hour}`.padStart(2, '0')}:00:00`).toISOString(),
  }
}

describe('scoring', () => {
  it('rewards starting with a fixed amount, even with no minutes', () => {
    expect(scoreParts('sprint', 0)).toEqual({ start: 18, focus: 0, total: 18 })
  })

  it('pays full value up to the session length', () => {
    expect(scoreParts('grind', FULL_VALUE_MIN).focus).toBe(75)
  })

  it('tapers past it, so one long block cannot dwarf several starts', () => {
    const long = scoreCompletion('grind', 120)
    const manyStarts = 4 * scoreCompletion('grind', 25)
    expect(long).toBeLessThan(manyStarts)
    expect(scoreParts('grind', FULL_VALUE_MIN + 10).focus).toBe(90)
  })
})

describe('levels', () => {
  it('steps at the threshold', () => {
    expect(levelForPoints(PTS_PER_LEVEL - 1)).toBe(0)
    expect(levelForPoints(PTS_PER_LEVEL)).toBe(1)
  })
})

describe('day keys', () => {
  it('rolls over months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('survives a daylight saving change', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })
})

describe('totalsByDay', () => {
  it('files a late evening session under the local day, not tomorrow in UTC', () => {
    const evening = done('2026-11-05', 'sprint', 10, 23)
    const totals = totalsByDay([evening])
    expect(totals.has('2026-11-05')).toBe(true)
  })

  it('recomputes points instead of trusting the stored number', () => {
    const entry = { ...done('2026-11-05', 'sprint', 10), points: 99999 }
    expect(totalsByDay([entry]).get('2026-11-05')?.points).toBe(scoreCompletion('sprint', 10))
  })
})

describe('buildRaceField', () => {
  const today = '2026-11-05'

  it('has nothing to race on a fresh start', () => {
    const f = buildRaceField(new Map(), today, 0)
    expect(f.hasField).toBe(false)
    expect(f.ahead).toBe(false)
  })

  it('sets the pacer at the median, so one huge day cannot become the bar', () => {
    const byDay = totalsByDay([
      done('2026-11-04', 'sprint', 0),
      done('2026-11-03', 'sprint', 0),
      done('2026-11-02', 'grind', 400),
    ])
    const f = buildRaceField(byDay, today, 0)
    expect(f.pacer).toBe(18)
    expect(f.best).toBeGreaterThan(f.pacer)
  })

  it('gives graded credit for each day passed', () => {
    const byDay = totalsByDay([done('2026-11-04', 'sprint', 0), done('2026-11-03', 'grind', 25)])
    const f = buildRaceField(byDay, today, 20)
    expect(f.passed).toBe(1)
    expect(f.ghosts).toHaveLength(2)
  })

  it('calls the previous day Yesterday and orders weakest first', () => {
    const byDay = totalsByDay([done('2026-11-04', 'grind', 25), done('2026-11-02', 'sprint', 0)])
    const f = buildRaceField(byDay, today, 0)
    expect(f.ghosts[0].label).toBe('Mon')
    expect(f.ghosts[1].label).toBe('Yesterday')
  })

  it('is not ahead at zero points', () => {
    const byDay = totalsByDay([done('2026-11-04', 'sprint', 0)])
    expect(buildRaceField(byDay, today, 0).ahead).toBe(false)
  })
})

describe('coming back', () => {
  const byDay = totalsByDay([done('2026-11-01', 'sprint', 0)])

  it('counts days away, with no debt', () => {
    expect(daysAway(byDay, '2026-11-05')).toBe(4)
    expect(daysAway(new Map(), '2026-11-05')).toBeNull()
  })

  it('does not treat today as away once it counts', () => {
    expect(daysAway(totalsByDay([done('2026-11-05', 'sprint', 0)]), '2026-11-05')).toBeNull()
  })

  it('counts days showed up without needing them consecutive', () => {
    const scattered = totalsByDay([
      done('2026-11-05', 'sprint', 0),
      done('2026-11-01', 'sprint', 0),
      done('2026-10-20', 'sprint', 0),
      done('2026-09-01', 'sprint', 0),
    ])
    expect(showedUpCount(scattered, '2026-11-05')).toBe(3)
  })
})

describe('summarize and weekBars', () => {
  it('names the strongest day', () => {
    const byDay = totalsByDay([done('2026-11-05', 'sprint', 0), done('2026-11-03', 'grind', 25)])
    const week = summarize(byDay, '2026-11-05')
    expect(week.activeDays).toBe(2)
    expect(week.completed).toBe(2)
    expect(week.bestLabel).toBe('Tue')
  })

  it('returns seven days ending today', () => {
    const bars = weekBars(new Map(), '2026-11-05')
    expect(bars).toHaveLength(7)
    expect(bars[6]).toMatchObject({ key: '2026-11-05', label: 'Today', isToday: true })
    expect(bars[0].key).toBe('2026-10-30')
  })
})

describe('small helpers', () => {
  it('ages tasks in whole local days', () => {
    expect(ageInDays(new Date('2026-11-01T12:00:00').toISOString(), '2026-11-05')).toBe(4)
    expect(ageInDays(new Date('2026-11-05T01:00:00').toISOString(), '2026-11-05')).toBe(0)
  })

  it('formats the clock', () => {
    expect(formatClock(1500)).toBe('25:00')
    expect(formatClock(61)).toBe('1:01')
    expect(formatClock(0)).toBe('0:00')
  })

  it('greets with no trailing punctuation, because a name gets appended', () => {
    for (const hour of [2, 9, 14, 19, 23]) {
      const d = new Date('2026-11-05T00:00:00')
      d.setHours(hour)
      expect(greeting(d)).toMatch(/^[A-Za-z ]+$/)
    }
  })

  it('keys a date by its local calendar day', () => {
    expect(dayKey(new Date('2026-01-09T12:00:00'))).toBe('2026-01-09')
  })
})
