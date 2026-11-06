import { REMINDER_DAYS, REMINDER_HOURS, planReminders } from '../reminders'

const at = (iso: string) => new Date(iso)

describe('REMINDER_HOURS', () => {
  it('says the actual time, because "morning" means nothing to a time-blind brain', () => {
    for (const { label } of REMINDER_HOURS) expect(label).toMatch(/^\d{1,2} [AP]M$/)
  })

  it('labels each hour truthfully', () => {
    for (const { hour, label } of REMINDER_HOURS) {
      const h12 = hour % 12 === 0 ? 12 : hour % 12
      expect(label).toBe(`${h12} ${hour < 12 ? 'AM' : 'PM'}`)
    }
  })
})

describe('planReminders', () => {
  it('schedules one nudge a day at the chosen hour', () => {
    const plan = planReminders(at('2026-11-05T08:00:00'), 9, false)
    expect(plan).toHaveLength(REMINDER_DAYS)
    expect(plan[0].at.getHours()).toBe(9)
    expect(plan[0].at.getDate()).toBe(5)
    expect(plan[1].at.getDate()).toBe(6)
  })

  it('skips today once the hour has passed', () => {
    const plan = planReminders(at('2026-11-05T10:00:00'), 9, false)
    expect(plan[0].at.getDate()).toBe(6)
    expect(plan).toHaveLength(REMINDER_DAYS)
  })

  it('skips today if something already got done', () => {
    const plan = planReminders(at('2026-11-05T08:00:00'), 18, true)
    expect(plan[0].at.getDate()).toBe(6)
  })

  it('goes quiet after a week away, because that many unanswered nudges is nagging', () => {
    const plan = planReminders(at('2026-11-05T08:00:00'), 9, false)
    const last = plan[plan.length - 1].at.getTime()
    const eightDays = at('2026-11-13T09:00:00').getTime()
    expect(last).toBeLessThan(eightDays)
  })

  it('never repeats the same words two days running', () => {
    const plan = planReminders(at('2026-11-05T08:00:00'), 9, false)
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].title).not.toBe(plan[i - 1].title)
    }
  })

  it('crosses a month boundary correctly', () => {
    const plan = planReminders(at('2026-11-29T08:00:00'), 9, false)
    expect(plan[2].at.getMonth()).toBe(11)
    expect(plan[2].at.getDate()).toBe(1)
  })
})
