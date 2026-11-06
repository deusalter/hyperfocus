import {
  FocusSession,
  STALE_SESSION_MS,
  adjustSession,
  canAdjust,
  completedStamp,
  focusedMinutes,
  hasExpired,
  isStaleExpired,
  newSession,
  pauseSession,
  remainingSec,
  resumeSession,
} from '../session'

const T0 = new Date('2026-11-05T20:00:00Z').getTime()
const min = (n: number) => n * 60 * 1000

function running(overrides: Partial<FocusSession> = {}): FocusSession {
  return { ...newSession({ id: 't1', title: 'Essay', cat: 'grind' }, 25, T0), ...overrides }
}

describe('newSession', () => {
  it('snapshots the task so the session survives the task being removed', () => {
    const s = running()
    expect(s).toMatchObject({ taskId: 't1', title: 'Essay', cat: 'grind', totalSec: 1500 })
    expect(s.endsAt).toBe(T0 + min(25))
    expect(s.running).toBe(true)
  })

  it('falls back to sprint for a task with no category yet', () => {
    expect(newSession({ id: 'x', title: 'y' }, 15, T0).cat).toBe('sprint')
  })
})

describe('remainingSec', () => {
  it('counts down against the wall clock while running', () => {
    expect(remainingSec(running(), T0 + min(5))).toBe(1200)
  })

  it('never goes negative', () => {
    expect(remainingSec(running(), T0 + min(90))).toBe(0)
  })

  it('freezes at the snapshot while paused', () => {
    const paused = pauseSession(running(), T0 + min(5))
    expect(remainingSec(paused, T0 + min(60))).toBe(1200)
  })

  it('never reports more than the whole session, even against a stale clock', () => {
    // a resume re-aims the end time; a render holding an older "now" would
    // otherwise show more time left than the session has
    const resumed = resumeSession(pauseSession(running(), T0 + min(5)), T0 + min(30))
    expect(remainingSec(resumed, T0)).toBeLessThanOrEqual(resumed.totalSec)
  })
})

describe('pause and resume', () => {
  it('re-aims the end time so paused time is not counted', () => {
    const paused = pauseSession(running(), T0 + min(5))
    const resumed = resumeSession(paused, T0 + min(30))
    expect(resumed.running).toBe(true)
    expect(resumed.endsAt).toBe(T0 + min(30) + min(20))
    expect(remainingSec(resumed, T0 + min(30))).toBe(1200)
  })
})

describe('focusedMinutes', () => {
  it('credits elapsed time', () => {
    expect(focusedMinutes(running(), T0 + min(10))).toBe(10)
  })

  it('credits at least a minute, because starting is the thing being rewarded', () => {
    expect(focusedMinutes(running(), T0 + 3000)).toBe(1)
  })

  it('credits the full session once the clock has run out', () => {
    expect(focusedMinutes(running(), T0 + min(400))).toBe(25)
  })

  it('does not count time spent paused', () => {
    const paused = pauseSession(running(), T0 + min(5))
    expect(focusedMinutes(paused, T0 + min(300))).toBe(5)
  })
})

describe('adjustSession', () => {
  it('extends a running session by moving the end and the total', () => {
    const s = adjustSession(running(), 5, T0 + min(1))
    expect(s.totalSec).toBe(1800)
    expect(s.endsAt).toBe(T0 + min(30))
    expect(remainingSec(s, T0 + min(1))).toBe(29 * 60)
  })

  it('extends a paused session through its snapshot', () => {
    const paused = pauseSession(running(), T0 + min(5))
    const s = adjustSession(paused, 5, T0 + min(6))
    expect(s.pausedRemaining).toBe(1500)
    expect(s.totalSec).toBe(1800)
    expect(s.running).toBe(false)
  })

  it('shortens without losing minutes already focused', () => {
    const before = running()
    const after = adjustSession(before, -5, T0 + min(10))
    expect(focusedMinutes(after, T0 + min(10))).toBe(10)
    expect(remainingSec(after, T0 + min(10))).toBe(600)
  })

  it('refuses a cut that would leave under a minute', () => {
    const s = running()
    const late = T0 + min(22)
    expect(adjustSession(s, -5, late)).toBe(s)
  })

  it('caps how long a session can grow', () => {
    let s = running()
    for (let i = 0; i < 60; i++) s = adjustSession(s, 5, T0)
    expect(s.totalSec).toBeLessThanOrEqual(3 * 60 * 60)
  })
})

describe('canAdjust', () => {
  it('matches what adjustSession will actually do', () => {
    const s = running()
    expect(canAdjust(s, 5, T0)).toBe(true)
    expect(canAdjust(s, -5, T0)).toBe(true)
    expect(canAdjust(s, -5, T0 + min(22))).toBe(false)
    expect(canAdjust({ ...s, totalSec: 3 * 60 * 60 }, 5, T0)).toBe(false)
  })
})

describe('hasExpired', () => {
  it('is true once a running clock passes the end', () => {
    expect(hasExpired(running(), T0 + min(25))).toBe(true)
    expect(hasExpired(running(), T0 + min(24))).toBe(false)
  })

  it('is never true while paused', () => {
    expect(hasExpired(pauseSession(running(), T0 + min(1)), T0 + min(600))).toBe(false)
  })
})

describe('completedStamp', () => {
  it('stamps now for a session finished early', () => {
    expect(completedStamp(running(), T0 + min(10))).toBe(new Date(T0 + min(10)).toISOString())
  })

  it('stamps the end of the clock if the app reopens later, so it lands on the right day', () => {
    const nextMorning = T0 + 14 * 60 * min(1)
    expect(completedStamp(running(), nextMorning)).toBe(new Date(T0 + min(25)).toISOString())
  })
})

describe('isStaleExpired', () => {
  it('flags only sessions that ran out long ago', () => {
    const s = running()
    expect(isStaleExpired(s, s.endsAt + STALE_SESSION_MS + 1)).toBe(true)
    expect(isStaleExpired(s, s.endsAt + min(5))).toBe(false)
  })

  it('leaves paused sessions alone however old they are', () => {
    const paused = pauseSession(running(), T0 + min(1))
    expect(isStaleExpired(paused, T0 + STALE_SESSION_MS * 10)).toBe(false)
  })
})
