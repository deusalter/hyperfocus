import { Task } from '../types'
import { daysBetween, dueChip, isOnToday, isOverdue, quickDates, rankForStart, splitBuckets } from '../tasks'

const TODAY = '2026-11-05' // a Thursday

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.id,
    bucket: 'today',
    createdAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('splitBuckets', () => {
  it('puts each task in its bucket', () => {
    const { inbox, today, later } = splitBuckets(
      [task({ id: 'i', bucket: 'inbox' }), task({ id: 't' }), task({ id: 'l', bucket: 'later' })],
      TODAY
    )
    expect(inbox.map((t) => t.id)).toEqual(['i'])
    expect(today.map((t) => t.id)).toEqual(['t'])
    expect(later.map((t) => t.id)).toEqual(['l'])
  })

  it('surfaces a Later task on Today on the day it falls due', () => {
    const { today, later } = splitBuckets([task({ id: 'due', bucket: 'later', due: TODAY })], TODAY)
    expect(today.map((t) => t.id)).toEqual(['due'])
    expect(later).toEqual([])
  })

  it('leaves future and overdue Later tasks where they are, so a gap never floods Today', () => {
    const { today, later } = splitBuckets(
      [
        task({ id: 'soon', bucket: 'later', due: '2026-11-06' }),
        task({ id: 'past', bucket: 'later', due: '2026-11-01' }),
      ],
      TODAY
    )
    expect(today).toEqual([])
    expect(later.map((t) => t.id)).toEqual(['past', 'soon'])
  })

  it('orders Later by date, so the nearest deadline among many imports is on top', () => {
    const { later } = splitBuckets(
      [
        task({ id: 'undated-a', bucket: 'later' }),
        task({ id: 'far', bucket: 'later', due: '2026-11-30' }),
        task({ id: 'undated-b', bucket: 'later' }),
        task({ id: 'near', bucket: 'later', due: '2026-11-09' }),
      ],
      TODAY
    )
    expect(later.map((t) => t.id)).toEqual(['near', 'far', 'undated-a', 'undated-b'])
  })

  it('leaves Today in the order things were added, so rows do not jump around', () => {
    const { today } = splitBuckets(
      [task({ id: 'b', due: '2026-11-20' }), task({ id: 'a', due: '2026-11-06' }), task({ id: 'c' })],
      TODAY
    )
    expect(today.map((t) => t.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('isOnToday', () => {
  it('matches how the lists are actually split', () => {
    expect(isOnToday(task({ id: 'a' }), TODAY)).toBe(true)
    expect(isOnToday(task({ id: 'b', bucket: 'later', due: TODAY }), TODAY)).toBe(true)
    expect(isOnToday(task({ id: 'c', bucket: 'later', due: '2026-11-06' }), TODAY)).toBe(false)
  })

  it('leaves an unsorted task in the inbox even if it has a date', () => {
    const inbox = task({ id: 'i', bucket: 'inbox', due: TODAY })
    expect(isOnToday(inbox, TODAY)).toBe(false)
    expect(splitBuckets([inbox], TODAY).inbox).toEqual([inbox])
  })
})

describe('daysBetween', () => {
  it('counts whole days in either direction, across a clock change', () => {
    expect(daysBetween('2026-11-05', '2026-11-06')).toBe(1)
    expect(daysBetween('2026-11-05', '2026-11-02')).toBe(-3)
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
  })
})

describe('rankForStart', () => {
  it('leads with what is due, soonest first', () => {
    const ranked = rankForStart(
      [
        task({ id: 'none', cat: 'fire' }),
        task({ id: 'today', due: TODAY, cat: 'grind' }),
        task({ id: 'old', due: '2026-11-02', cat: 'grind' }),
      ],
      TODAY
    )
    expect(ranked.map((t) => t.id)).toEqual(['old', 'today', 'none'])
  })

  it('does not treat a future date as urgent', () => {
    const ranked = rankForStart(
      [task({ id: 'next-week', due: '2026-11-12', cat: 'grind' }), task({ id: 'quick', cat: 'sprint' })],
      TODAY
    )
    expect(ranked.map((t) => t.id)).toEqual(['quick', 'next-week'])
  })

  it('then fire, then quick wins, then the deep stuff', () => {
    const ranked = rankForStart(
      [task({ id: 'g', cat: 'grind' }), task({ id: 's', cat: 'sprint' }), task({ id: 'f', cat: 'fire' })],
      TODAY
    )
    expect(ranked.map((t) => t.id)).toEqual(['f', 's', 'g'])
  })

  it('breaks ties oldest first, so a new task cannot keep bumping an old one', () => {
    const ranked = rankForStart(
      [
        task({ id: 'new', cat: 'sprint', createdAt: '2026-11-04T00:00:00.000Z' }),
        task({ id: 'old', cat: 'sprint', createdAt: '2026-10-01T00:00:00.000Z' }),
      ],
      TODAY
    )
    expect(ranked.map((t) => t.id)).toEqual(['old', 'new'])
  })

  it('does not mutate the list it was given', () => {
    const list = [task({ id: 'a', cat: 'grind' }), task({ id: 'b', cat: 'fire' })]
    rankForStart(list, TODAY)
    expect(list.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('isOverdue', () => {
  it('counts only past dates on sorted tasks', () => {
    expect(isOverdue(task({ id: 'a', due: '2026-11-04' }), TODAY)).toBe(true)
    expect(isOverdue(task({ id: 'b', due: TODAY }), TODAY)).toBe(false)
    expect(isOverdue(task({ id: 'c' }), TODAY)).toBe(false)
    expect(isOverdue(task({ id: 'd', bucket: 'inbox', due: '2026-11-01' }), TODAY)).toBe(false)
  })
})

describe('dueChip', () => {
  it('uses relative words nearby', () => {
    expect(dueChip(TODAY, TODAY)).toEqual({ text: 'Today', overdue: false })
    expect(dueChip('2026-11-06', TODAY)).toEqual({ text: 'Tomorrow', overdue: false })
    expect(dueChip('2026-11-04', TODAY)).toEqual({ text: 'Yesterday', overdue: true })
  })

  it('names the weekday within a week, then falls back to the date', () => {
    expect(dueChip('2026-11-10', TODAY).text).toBe('Tue')
    expect(dueChip('2026-11-20', TODAY).text).toBe('Nov 20')
    expect(dueChip('2026-11-02', TODAY)).toEqual({ text: 'Mon', overdue: true })
    expect(dueChip('2026-10-01', TODAY)).toEqual({ text: 'Oct 1', overdue: true })
  })
})

describe('quickDates', () => {
  const keys = (today: string) => Object.fromEntries(quickDates(today).map((q) => [q.label, q.key]))

  it('offers the obvious near dates from a weekday', () => {
    expect(keys(TODAY)).toEqual({
      Today: '2026-11-05',
      Tomorrow: '2026-11-06',
      'This weekend': '2026-11-07',
      'Next week': '2026-11-09',
    })
  })

  it('does not offer "this weekend" on the weekend itself', () => {
    const fromSaturday = keys('2026-11-07')
    expect(fromSaturday).toEqual({
      Today: '2026-11-07',
      Tomorrow: '2026-11-08',
      'Next week': '2026-11-09',
    })
    expect(keys('2026-11-08')).toEqual({
      Today: '2026-11-08',
      Tomorrow: '2026-11-09',
      'Next week': '2026-11-16',
    })
  })

  it('does not offer "this weekend" on a Friday when Saturday is just tomorrow', () => {
    expect(keys('2026-11-06')).toEqual({
      Today: '2026-11-06',
      Tomorrow: '2026-11-07',
      'Next week': '2026-11-09',
    })
  })
})
