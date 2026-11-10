import { mergeBackup, parseBackup } from '../backup'
import { Completion, Task } from '../types'

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  cat: 'sprint',
  bucket: 'today',
  createdAt: '2026-11-01T12:00:00.000Z',
  ...overrides,
})

const done = (id: string, overrides: Partial<Completion> = {}): Completion => ({
  id,
  title: `Done ${id}`,
  cat: 'grind',
  points: 49,
  minutes: 25,
  completedAt: '2026-11-02T18:00:00.000Z',
  ...overrides,
})

const exported = (tasks: unknown[], history: unknown[]) =>
  JSON.stringify({ exportedAt: '2026-11-09T00:00:00.000Z', tasks, history }, null, 2)

describe('parseBackup', () => {
  it('reads what the export writes', () => {
    const backup = parseBackup(exported([task('a')], [done('h')]))
    expect(backup?.tasks).toEqual([task('a')])
    expect(backup?.history).toEqual([done('h')])
  })

  it('survives stray whitespace around the paste, and punctuation inside a title', () => {
    const raw = `\n\n  ${exported([task('a', { title: 'Call “Sam”' })], [])}  \n`
    expect(parseBackup(raw)?.tasks[0].title).toBe('Call “Sam”')
  })

  it('says no to anything that is not an export', () => {
    expect(parseBackup('')).toBeNull()
    expect(parseBackup('buy milk')).toBeNull()
    expect(parseBackup('[]')).toBeNull()
    expect(parseBackup('{"tasks": "nope"}')).toBeNull()
    expect(parseBackup('{"hello": 1}')).toBeNull()
  })

  it('drops entries it cannot make sense of and keeps the rest', () => {
    const backup = parseBackup(
      exported(
        [task('a'), { id: 'b' }, null, { id: 'c', title: 'No bucket', createdAt: 'x' }, task('d', { bucket: 'later' })],
        [done('h'), { id: 'i', title: 'No date', cat: 'sprint', minutes: 5 }, 'junk']
      )
    )
    expect(backup?.tasks.map((t) => t.id)).toEqual(['a', 'd'])
    expect(backup?.history.map((c) => c.id)).toEqual(['h'])
  })

  it('keeps only the fields the app knows, in shapes it can use', () => {
    const backup = parseBackup(
      exported(
        [
          {
            ...task('a'),
            title: 'x'.repeat(500),
            cat: 'mystery',
            due: 'next tuesday',
            firstStep: 'open the doc',
            surprise: { nested: true },
          },
        ],
        [{ ...done('h'), cat: 'mystery', minutes: -5 }, { ...done('i'), minutes: 99999 }]
      )
    )
    const restored = backup?.tasks[0]
    expect(restored?.title.length).toBe(200)
    expect(restored?.cat).toBeUndefined()
    expect(restored?.due).toBeUndefined()
    expect(restored?.firstStep).toBe('open the doc')
    expect(restored).not.toHaveProperty('surprise')
    // a category the app doesn't have can't be scored, so that entry goes
    expect(backup?.history.map((c) => c.id)).toEqual(['i'])
    expect(backup?.history[0].minutes).toBeLessThanOrEqual(180)
  })
})

describe('mergeBackup', () => {
  it('adds what is missing and leaves what is here alone', () => {
    const current = { tasks: [task('a', { title: 'Edited since' })], history: [done('h')] }
    const merged = mergeBackup(current, {
      tasks: [task('a', { title: 'Old title' }), task('b')],
      history: [done('h'), done('i')],
    })
    expect(merged.tasks.map((t) => t.id).sort()).toEqual(['a', 'b'])
    expect(merged.tasks.find((t) => t.id === 'a')?.title).toBe('Edited since')
    expect(merged.history.map((c) => c.id).sort()).toEqual(['h', 'i'])
    expect(merged.addedTasks).toBe(1)
    expect(merged.addedHistory).toBe(1)
  })

  it('brings back a task finished since the export, which nothing links to its completion', () => {
    // A known limit, stated rather than hidden: a completion has its own id, so a
    // restore can't tell this task was done in the meantime. It comes back, and
    // letting it go again is one tap.
    const current = { tasks: [], history: [done('h')] }
    const merged = mergeBackup(current, { tasks: [task('a')], history: [done('h')] })
    expect(merged.addedTasks).toBe(1)
    expect(merged.addedHistory).toBe(0)
  })

  it('restoring the same export twice changes nothing the second time', () => {
    const backup = { tasks: [task('a')], history: [done('h')] }
    const once = mergeBackup({ tasks: [], history: [] }, backup)
    const twice = mergeBackup(once, backup)
    expect(twice.addedTasks).toBe(0)
    expect(twice.addedHistory).toBe(0)
    expect(twice.tasks).toBe(once.tasks)
    expect(twice.history).toBe(once.history)
  })

  it('keeps history newest first, which is the order the rest of the app writes it in', () => {
    const merged = mergeBackup(
      { tasks: [], history: [done('new', { completedAt: '2026-11-08T10:00:00.000Z' })] },
      { tasks: [], history: [done('old', { completedAt: '2026-10-01T10:00:00.000Z' })] }
    )
    expect(merged.history.map((c) => c.id)).toEqual(['new', 'old'])
  })
})
