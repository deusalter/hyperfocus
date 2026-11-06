import { Task } from '../types'
import { FEED_WINDOW_DAYS, mergeFeed, normalizeFeedUrl, parseIcs, splitCourse } from '../feed'
import { addDays } from '../points'

const TODAY = '2026-11-05'
const NOW = new Date('2026-11-05T18:00:00.000Z').getTime()
const BEGIN = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'
const END = 'END:VCALENDAR\r\n'

describe('parseIcs', () => {
  it('reads the shape Canvas actually publishes', () => {
    const events = parseIcs(
      BEGIN +
        [
          'BEGIN:VEVENT',
          'DTSTAMP:20261101T000000Z',
          'UID:event-assignment-123456',
          'DTSTART:20261111T075900Z',
          'DTEND:20261111T075900Z',
          'CLASS:PUBLIC',
          'SEQUENCE:0',
          'SUMMARY:Essay 3 draft [ENGL 1A Section 4]',
          'URL;VALUE=URI:https://school.instructure.com/calendar?include_contexts=course_1#assignment_123456',
          'END:VEVENT',
        ].join('\r\n') +
        '\r\n' +
        END
    )
    expect(events).toHaveLength(1)
    expect(events[0].uid).toBe('event-assignment-123456')
    expect(events[0].summary).toBe('Essay 3 draft [ENGL 1A Section 4]')
    // 07:59 UTC on the 11th is the evening of the 10th in California
    const expected = new Date(Date.UTC(2026, 10, 11, 7, 59))
    const y = expected.getFullYear()
    const m = `${expected.getMonth() + 1}`.padStart(2, '0')
    const d = `${expected.getDate()}`.padStart(2, '0')
    expect(events[0].date).toBe(`${y}-${m}-${d}`)
  })

  it('reads all-day dates exactly, with no timezone shift', () => {
    const [e] = parseIcs(
      BEGIN + 'BEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20261110\nSUMMARY:Quiz\nEND:VEVENT\n' + END
    )
    expect(e.date).toBe('2026-11-10')
  })

  it('takes the written date for a time with a named zone', () => {
    const [e] = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:a\nDTSTART;TZID=America/New_York:20261110T235900\nSUMMARY:Quiz\nEND:VEVENT\n' +
        END
    )
    expect(e.date).toBe('2026-11-10')
  })

  it('unfolds wrapped lines and unescapes text', () => {
    const [e] = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\r\nUID:a\r\nDTSTART;VALUE=DATE:20261110\r\nSUMMARY:Read chapters 3\\, 4\\; then\r\n  write a summary\r\nEND:VEVENT\r\n' +
        END
    )
    expect(e.summary).toBe('Read chapters 3, 4; then write a summary')
  })

  it('skips events with no id, no date, or no title', () => {
    const events = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nDTSTART;VALUE=DATE:20261110\nSUMMARY:no uid\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:b\nSUMMARY:no date\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:c\nDTSTART;VALUE=DATE:20261110\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:d\nDTSTART:garbage\nSUMMARY:bad date\nEND:VEVENT\n' +
        END
    )
    expect(events).toEqual([])
  })

  it('returns nothing for something that is not a calendar', () => {
    expect(parseIcs('<html>Sign in to Canvas</html>')).toEqual([])
  })
})

describe('splitCourse', () => {
  it('pulls the bracketed course off the end', () => {
    expect(splitCourse('HW 1 [CS 101]')).toEqual({ title: 'HW 1', course: 'CS 101' })
  })

  it('leaves titles without a course alone', () => {
    expect(splitCourse('Dentist')).toEqual({ title: 'Dentist' })
    expect(splitCourse('Read [optional] chapter')).toEqual({ title: 'Read [optional] chapter' })
  })

  it('keeps the title when the brackets are all there is', () => {
    expect(splitCourse('[CS 101]')).toEqual({ title: '[CS 101]' })
  })
})

describe('normalizeFeedUrl', () => {
  it('accepts https and upgrades webcal', () => {
    expect(normalizeFeedUrl('  https://a.instructure.com/feeds/calendars/user_x.ics ')).toBe(
      'https://a.instructure.com/feeds/calendars/user_x.ics'
    )
    expect(normalizeFeedUrl('webcal://a.com/x.ics')).toBe('https://a.com/x.ics')
  })

  it('rejects anything else, including plain http', () => {
    expect(normalizeFeedUrl('http://a.com/x.ics')).toBeNull()
    expect(normalizeFeedUrl('not a link')).toBeNull()
    expect(normalizeFeedUrl('')).toBeNull()
    expect(normalizeFeedUrl('https://a b.com/x')).toBeNull()
  })
})

describe('mergeFeed', () => {
  const event = (uid: string, date: string, summary = `Task ${uid} [Bio]`) => ({ uid, date, summary })
  const canvasUrl = 'https://a.instructure.com/feeds/calendars/user_x.ics'
  const gcalUrl = 'https://calendar.google.com/calendar/ical/x/basic.ics'

  const merge = (
    tasks: Task[],
    seen: string[],
    events: ReturnType<typeof event>[],
    url = gcalUrl
  ) => mergeFeed({ tasks, seen, events, today: TODAY, now: NOW, url })

  it('adds new events to Later with their date and course', () => {
    const r = merge([], [], [event('a', '2026-11-10')])
    expect(r.added).toBe(1)
    expect(r.tasks[0]).toMatchObject({
      title: 'Task a',
      course: 'Bio',
      bucket: 'later',
      due: '2026-11-10',
      externalId: 'a',
    })
    expect(r.seen).toEqual(['a'])
  })

  it('labels the source so the calendar can show where it came from', () => {
    expect(merge([], [], [event('a', '2026-11-10')]).tasks[0].source).toBe('feed')
    expect(
      merge([], [], [event('event-assignment-1', '2026-11-10')], canvasUrl).tasks[0].source
    ).toBe('canvas')
  })

  it('ignores what is already past, so connecting never creates a backlog', () => {
    const r = merge([], [], [event('old', '2026-11-04')])
    expect(r.added).toBe(0)
    expect(r.tasks).toEqual([])
  })

  it('includes today and stops at the window', () => {
    const r = merge(
      [],
      [],
      [
        event('today', TODAY),
        event('edge', addDays(TODAY, FEED_WINDOW_DAYS)),
        event('far', addDays(TODAY, FEED_WINDOW_DAYS + 1)),
      ]
    )
    expect(r.tasks.map((t) => t.externalId).sort()).toEqual(['edge', 'today'])
  })

  it('does not bring back anything the user finished or let go', () => {
    const r = merge([], ['gone'], [event('gone', '2026-11-10')])
    expect(r.added).toBe(0)
    expect(r.tasks).toEqual([])
  })

  it('follows a moved deadline without touching the rest of the task', () => {
    const existing: Task = {
      id: 'mine',
      title: 'My renamed title',
      cat: 'fire',
      bucket: 'today',
      due: '2026-11-10',
      externalId: 'a',
      createdAt: '2026-11-01T00:00:00.000Z',
    }
    const r = merge([existing], ['a'], [event('a', '2026-11-12')])
    expect(r.updated).toBe(1)
    expect(r.tasks[0]).toEqual({ ...existing, due: '2026-11-12' })
  })

  it('changes nothing on a repeat sync', () => {
    const first = merge([], [], [event('a', '2026-11-10')])
    const second = merge(first.tasks, first.seen, [event('a', '2026-11-10')])
    expect(second.added).toBe(0)
    expect(second.updated).toBe(0)
    expect(second.tasks).toBe(first.tasks)
  })

  it('takes only assignments from a Canvas feed, not class meetings', () => {
    const r = merge(
      [],
      [],
      [event('event-assignment-1', '2026-11-10'), event('event-calendar-event-2', '2026-11-10')],
      canvasUrl
    )
    expect(r.tasks.map((t) => t.externalId)).toEqual(['event-assignment-1'])
  })

  it('takes everything from a non-Canvas feed', () => {
    const r = merge([], [], [event('event-calendar-event-2', '2026-11-10')])
    expect(r.added).toBe(1)
  })
})
