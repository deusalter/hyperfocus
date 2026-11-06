import { Task } from '../types'
import {
  FEED_WINDOW_DAYS,
  isCanvasUrl,
  mergeFeed,
  normalizeFeedUrl,
  parseIcs,
  splitCourse,
} from '../feed'
import { addDays } from '../points'
import { MAX_TITLE } from '../tasks'

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

  it('does not let an alarm inside an event overwrite its title or id', () => {
    const [e] = parseIcs(
      BEGIN +
        [
          'BEGIN:VEVENT',
          'UID:real-id',
          'DTSTART;VALUE=DATE:20261110',
          'SUMMARY:The actual event',
          'BEGIN:VALARM',
          'ACTION:EMAIL',
          'SUMMARY:Alarm notification',
          'UID:alarm-id',
          'END:VALARM',
          'END:VEVENT',
        ].join('\n') +
        '\n' +
        END
    )
    expect(e.summary).toBe('The actual event')
    expect(e.uid).toBe('real-id')
  })

  it('still closes an event that has an alarm inside it', () => {
    const events = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20261110\nBEGIN:VALARM\nEND:VALARM\nSUMMARY:After the alarm\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:b\nDTSTART;VALUE=DATE:20261111\nSUMMARY:Next\nEND:VEVENT\n' +
        END
    )
    expect(events.map((e) => e.summary)).toEqual(['After the alarm', 'Next'])
  })

  it('leaves out cancelled events', () => {
    const events = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20261110\nSUMMARY:Off\nSTATUS:CANCELLED\nEND:VEVENT\n' +
        END
    )
    expect(events).toEqual([])
  })

  it('gives an edited instance of a series its own id, so the two never fight over one task', () => {
    const events = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:s\nDTSTART;VALUE=DATE:20261110\nSUMMARY:Series\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:s\nRECURRENCE-ID;VALUE=DATE:20261117\nDTSTART;VALUE=DATE:20261118\nSUMMARY:Moved\nEND:VEVENT\n' +
        END
    )
    expect(new Set(events.map((e) => e.uid)).size).toBe(2)
  })

  it('rejects dates that do not exist instead of storing one that crashes rendering', () => {
    const events = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20261131\nSUMMARY:November 31st\nEND:VEVENT\n' +
        'BEGIN:VEVENT\nUID:b\nDTSTART:20261345T120000Z\nSUMMARY:Month 13\nEND:VEVENT\n' +
        END
    )
    expect(events).toEqual([])
  })

  it('reads escapes in one pass, so an escaped backslash before n is not a line break', () => {
    const [e] = parseIcs(
      BEGIN +
        'BEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20261110\nSUMMARY:Read C:\\\\new\\nthen stop\nEND:VEVENT\n' +
        END
    )
    expect(e.summary).toBe('Read C:\\new then stop')
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

describe('isCanvasUrl', () => {
  it('recognises hosted Canvas and schools on their own domains', () => {
    expect(isCanvasUrl('https://school.instructure.com/feeds/calendars/user_abc.ics')).toBe(true)
    expect(isCanvasUrl('https://bcourses.berkeley.edu/feeds/calendars/user_abc.ics')).toBe(true)
  })

  it('is not fooled by the word canvas in some other calendar link', () => {
    expect(isCanvasUrl('https://calendar.google.com/calendar/ical/canvas.club/basic.ics')).toBe(false)
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
      feedDue: '2026-11-10',
      externalId: 'a',
      createdAt: '2026-11-01T00:00:00.000Z',
    }
    const r = merge([existing], ['a'], [event('a', '2026-11-12')])
    expect(r.updated).toBe(1)
    expect(r.tasks[0]).toEqual({ ...existing, due: '2026-11-12', feedDue: '2026-11-12' })
  })

  it('leaves alone a date the user changed themselves', () => {
    const imported = merge([], [], [event('a', '2026-11-12')]).tasks[0]
    const rescheduled: Task = { ...imported, due: '2026-11-08' }
    const noDate: Task = { ...imported, due: undefined }
    for (const task of [rescheduled, noDate]) {
      const r = merge([task], ['a'], [event('a', '2026-11-12')])
      expect(r.updated).toBe(0)
      expect(r.tasks[0]).toBe(task)
    }
  })

  it('still follows the school if it moves the deadline after the user rescheduled', () => {
    const imported = merge([], [], [event('a', '2026-11-12')]).tasks[0]
    const rescheduled: Task = { ...imported, due: '2026-11-08' }
    const r = merge([rescheduled], ['a'], [event('a', '2026-11-20')])
    expect(r.tasks[0].due).toBe('2026-11-20')
  })

  it('keeps imported titles to the same length as typed ones', () => {
    const long = 'x'.repeat(MAX_TITLE + 500)
    const r = merge([], [], [{ uid: 'a', date: '2026-11-10', summary: long }])
    expect(r.tasks[0].title).toHaveLength(MAX_TITLE)
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
