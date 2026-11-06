import { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppProvider, useApp } from '../AppStore'
import { syncReminders, syncSessionAlert, clearAllNotifications } from '@/lib/notifications'
import { silenceFocusSound, syncFocusSound } from '@/lib/sound'
import { applyAppearance } from '@/lib/appearance'
import { dayKey } from '@/lib/points'
import { DEFAULT_SETTINGS, Task } from '@/lib/types'

/**
 * The store with real logic and storage semantics, under the iOS test environment.
 * The services that can only do their job on a device are mocked, which is exactly
 * what's worth checking here: that the store asks them for the right thing.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest hoists this above imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}))
jest.mock('@/lib/notifications', () => ({
  clearAllNotifications: jest.fn(() => Promise.resolve()),
  requestNotifications: jest.fn(() => Promise.resolve(true)),
  syncReminders: jest.fn(() => Promise.resolve()),
  syncSessionAlert: jest.fn(() => Promise.resolve()),
}))
jest.mock('@/lib/appearance', () => ({
  applyAppearance: jest.fn(),
}))
jest.mock('@/lib/sound', () => ({
  silenceFocusSound: jest.fn(),
  syncFocusSound: jest.fn(),
}))

const MIN = 60 * 1000
const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  cat: 'sprint',
  bucket: 'today',
  createdAt: '2026-01-01T12:00:00.000Z',
  ...overrides,
})

const SETTINGS = { ...DEFAULT_SETTINGS, onboarded: true }

/** Start the app on the given storage contents. Strings are stored as-is. */
async function boot(seed: Record<string, unknown> = {}) {
  await AsyncStorage.clear()
  for (const [key, value] of Object.entries(seed)) {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  }
  const view = renderHook(() => useApp(), { wrapper })
  await waitFor(() => expect(view.result.current.hydrated).toBe(true))
  return view
}

const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null')

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('loading saved data', () => {
  it('a corrupt settings value costs only the settings, never the tasks', async () => {
    const { result } = await boot({
      'hf2-settings': '{"name":"Sam","focusLen":',
      'hf2-tasks': [task('a')],
      'hf2-history': [],
    })
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a'])
    // and they aren't sent back through the welcome for it
    expect(result.current.settings.onboarded).toBe(true)

    act(() => result.current.addToInbox('new thing'))
    const saved = await stored('hf2-tasks')
    expect(saved.map((t: Task) => t.id)).toContain('a')
    expect(saved).toHaveLength(2)
  })

  it('a corrupt session is dropped without taking anything else with it', async () => {
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': [task('a')],
      'hf2-focus': '{not json',
    })
    expect(result.current.focus).toBeNull()
    expect(result.current.tasks).toHaveLength(1)
  })

  it('unreadable v2 data is not replaced with years-old v1 data', async () => {
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': '{broken',
      'hf2-history': '{broken',
      'hyperfocus-tasks': [{ id: 'ancient', title: 'From 2024', category: 'today' }],
    })
    expect(result.current.tasks).toEqual([])
    expect(await AsyncStorage.getItem('hf2-tasks')).toBe('{broken')
  })

  it('still migrates v1 data when there has never been any v2 data', async () => {
    const { result } = await boot({
      'hyperfocus-tasks': [{ id: 'old', title: 'Old task', category: 'today' }],
    })
    expect(result.current.tasks.map((t) => t.title)).toEqual(['Old task'])
    expect(await stored('hf2-tasks')).toHaveLength(1)
  })

  it('drops settings left over from earlier versions', async () => {
    const { result } = await boot({
      'hf2-settings': { name: 'Old', focusLen: 15, reminders: true, sounds: true, onboarded: true },
    })
    expect(result.current.settings.focusLen).toBe(15)
    expect(result.current.settings).not.toHaveProperty('reminders')
    expect(result.current.settings.reminderHour).toBeNull()
    expect(result.current.settings.sound).toBe('off')
  })
})

describe('finishing a session', () => {
  const started = async (tasks = [task('a'), task('b', { cat: 'grind' })]) => {
    const view = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': tasks })
    act(() => view.result.current.startFocus('a'))
    return view
  }

  it('Done takes the task off the list and logs the session', async () => {
    const { result } = await started()
    act(() => {
      result.current.finishFocus('done')
    })
    expect(result.current.tasks.map((t) => t.id)).toEqual(['b'])
    expect(result.current.history).toHaveLength(1)
    expect(result.current.lastRecap?.ended).toBe('done')
    expect(result.current.recapPending).toBe(true)
    expect(result.current.focus).toBeNull()
    expect(await AsyncStorage.getItem('hf2-focus')).toBeNull()
  })

  it('running out of time keeps the task and asks', async () => {
    const endsAt = Date.now() + 60
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': [task('a')],
      'hf2-focus': { taskId: 'a', title: 'Task a', cat: 'sprint', totalSec: 1500, running: true, endsAt, pausedRemaining: 1500 },
    })
    await waitFor(() => expect(result.current.lastRecap?.ended).toBe('expired'))
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a'])
    expect(result.current.history[0].minutes).toBe(25)
    expect(result.current.focus).toBeNull()
  })

  it('a session that ran out while the app was closed still ends, and is credited to then', async () => {
    const endsAt = Date.now() - 3 * MIN
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': [task('a')],
      'hf2-focus': { taskId: 'a', title: 'Task a', cat: 'sprint', totalSec: 1500, running: true, endsAt, pausedRemaining: 1500 },
    })
    await waitFor(() => expect(result.current.lastRecap?.ended).toBe('expired'))
    expect(result.current.history[0].completedAt).toBe(new Date(endsAt).toISOString())
  })

  it('one that ran out long ago is banked with no recap, under the right task', async () => {
    const endsAt = Date.now() - 24 * 60 * MIN
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': [task('a', { title: 'Essay', cat: 'grind' })],
      // saved by an older version, with no title or category of its own
      'hf2-focus': { taskId: 'a', totalSec: 1500, running: true, endsAt, pausedRemaining: 1500 },
    })
    expect(result.current.lastRecap).toBeNull()
    expect(result.current.focus).toBeNull()
    expect(result.current.history[0]).toMatchObject({ title: 'Essay', cat: 'grind', minutes: 25 })
    expect(result.current.tasks).toHaveLength(1)
  })

  it('a paused session is never ended by the clock', async () => {
    const { result } = await boot({
      'hf2-settings': SETTINGS,
      'hf2-tasks': [task('a')],
      'hf2-focus': { taskId: 'a', totalSec: 1500, running: false, endsAt: Date.now() - 48 * 60 * MIN, pausedRemaining: 600 },
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120))
    })
    expect(result.current.focus?.pausedRemaining).toBe(600)
    expect(result.current.lastRecap).toBeNull()
  })

  it('checking off the running task finishes the session, once, with no double score', async () => {
    const { result } = await started()
    act(() => result.current.completeTask('a'))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.focus).toBeNull()
    expect(result.current.recapPending).toBe(true)
    expect(result.current.tasks.map((t) => t.id)).toEqual(['b'])
    expect(result.current.undoOffer).toBeNull()
  })

  it('Done and the clock racing only log it once', async () => {
    const { result } = await started()
    act(() => {
      result.current.finishFocus('done')
      result.current.finishFocus('expired')
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.lastRecap?.ended).toBe('done')
  })

  it('a finished task can be put back', async () => {
    const { result } = await started()
    act(() => {
      result.current.finishFocus('done')
    })
    act(() => result.current.putBackRecapTask())
    expect(result.current.tasks.find((t) => t.id === 'a')?.bucket).toBe('today')
    expect(result.current.history).toHaveLength(1)
  })

  it('stopping logs nothing and keeps the task', async () => {
    const { result } = await started()
    act(() => result.current.abandonFocus())
    expect(result.current.history).toHaveLength(0)
    expect(result.current.tasks).toHaveLength(2)
    expect(result.current.focus).toBeNull()
  })
})

describe('starting and switching', () => {
  it('a session picks up an edit made in the same tap', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a')] })
    act(() => {
      result.current.updateTask('a', { title: 'Renamed' })
      result.current.startFocus('a')
    })
    expect(result.current.focus?.title).toBe('Renamed')
  })

  it('switching banks what was earned, keeps that task, and starts the new one', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a'), task('b')] })
    act(() => result.current.startFocus('a'))
    act(() => result.current.switchFocus('b'))
    expect(result.current.focus?.taskId).toBe('b')
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].title).toBe('Task a')
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a', 'b'])
    expect(result.current.recapPending).toBe(false)
  })

  it('switching to a task that has since gone leaves the running session alone', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a')] })
    act(() => result.current.startFocus('a'))
    act(() => result.current.switchFocus('gone'))
    expect(result.current.focus?.taskId).toBe('a')
    expect(result.current.history).toHaveLength(0)
  })

  it('a session keeps its name if the task is let go while it runs', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a', { title: 'Essay' })] })
    act(() => result.current.startFocus('a'))
    act(() => result.current.letGo('a'))
    act(() => {
      result.current.finishFocus('done')
    })
    expect(result.current.history[0].title).toBe('Essay')
  })
})

describe('undo', () => {
  const list = [task('a'), task('b'), task('c')]

  it('brings a checked-off task back where it was and removes the points', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': list })
    act(() => result.current.completeTask('b'))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.undoOffer?.message).toMatch(/\+18 pts/)
    act(() => result.current.undo())
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(result.current.history).toHaveLength(0)
    expect(result.current.undoOffer).toBeNull()
    expect((await stored('hf2-tasks')).map((t: Task) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('brings a let-go task back where it was', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': list })
    act(() => result.current.letGo('a'))
    expect(result.current.tasks.map((t) => t.id)).toEqual(['b', 'c'])
    act(() => result.current.undo())
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('the offer goes away by itself, and only the latest one can be taken', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': list })
    jest.useFakeTimers()
    try {
      act(() => result.current.letGo('a'))
      act(() => {
        jest.advanceTimersByTime(3000)
      })
      act(() => result.current.letGo('b'))
      act(() => {
        jest.advanceTimersByTime(3000)
      })
      // 6s after the first, but only 3s after the second: the timer restarted
      expect(result.current.undoOffer).not.toBeNull()
      act(() => {
        jest.advanceTimersByTime(2100)
      })
      expect(result.current.undoOffer).toBeNull()
    } finally {
      jest.useRealTimers()
    }
    // nothing left to take back
    act(() => result.current.undo())
    expect(result.current.tasks.map((t) => t.id)).toEqual(['c'])
  })
})

describe('calendar feed', () => {
  const soon = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return dayKey(d).replaceAll('-', '')
  })()
  const later = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return dayKey(d).replaceAll('-', '')
  })()
  const URL = 'https://school.instructure.com/feeds/calendars/user_abc.ics'
  const ics = (date: string) =>
    `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:event-assignment-1\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:Essay [ENGL 1A]\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`
  const respond = (body: string) => ({ ok: true, text: () => Promise.resolve(body) })

  /** A fetch that waits until the test lets it finish. */
  function deferredFetch() {
    let release: (body: string) => void = () => {}
    const pending = new Promise((resolve) => {
      release = (body) => resolve(respond(body))
    })
    global.fetch = jest.fn(() => pending) as unknown as typeof fetch
    return release
  }

  it('connecting imports what is ahead and remembers the link', async () => {
    global.fetch = jest.fn(() => Promise.resolve(respond(ics(soon)))) as unknown as typeof fetch
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    await act(async () => {
      await result.current.connectFeed(URL)
    })
    expect(result.current.tasks[0]).toMatchObject({ title: 'Essay', course: 'ENGL 1A', source: 'canvas' })
    expect(result.current.settings.feedUrl).toBe(URL)
    expect(result.current.feed).toMatchObject({ added: 1, syncing: false, error: null })
    expect(result.current.today).toEqual([])
  })

  it('finished work does not come back on the next sync', async () => {
    global.fetch = jest.fn(() => Promise.resolve(respond(ics(soon)))) as unknown as typeof fetch
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    await act(async () => {
      await result.current.connectFeed(URL)
    })
    act(() => result.current.completeTask(result.current.tasks[0].id))
    await act(async () => {
      await result.current.syncFeed()
    })
    expect(result.current.tasks).toEqual([])
    expect(result.current.feed.added).toBe(0)
  })

  it('reports a deadline the school moved, but leaves one the user moved alone', async () => {
    global.fetch = jest.fn(() => Promise.resolve(respond(ics(soon)))) as unknown as typeof fetch
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    await act(async () => {
      await result.current.connectFeed(URL)
    })
    const id = result.current.tasks[0].id

    act(() => result.current.updateTask(id, { due: undefined }))
    await act(async () => {
      await result.current.syncFeed()
    })
    expect(result.current.tasks[0].due).toBeUndefined()
    expect(result.current.feed.moved).toBe(0)

    global.fetch = jest.fn(() => Promise.resolve(respond(ics(later)))) as unknown as typeof fetch
    await act(async () => {
      await result.current.syncFeed()
    })
    expect(result.current.tasks[0].due?.replaceAll('-', '')).toBe(later)
    expect(result.current.feed.moved).toBe(1)
  })

  it('disconnecting during a sync discards what comes back', async () => {
    const release = deferredFetch()
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    let finished: Promise<boolean> = Promise.resolve(false)
    act(() => {
      finished = result.current.connectFeed(URL)
    })
    act(() => result.current.disconnectFeed())
    await act(async () => {
      release(ics(soon))
      await finished
    })
    expect(result.current.settings.feedUrl).toBeNull()
    expect(result.current.tasks).toEqual([])
    expect(result.current.feed.syncing).toBe(false)
  })

  it('resetting during a sync does not bring the link or tasks back', async () => {
    const release = deferredFetch()
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    let finished: Promise<boolean> = Promise.resolve(false)
    act(() => {
      finished = result.current.connectFeed(URL)
    })
    act(() => result.current.resetAll())
    await act(async () => {
      release(ics(soon))
      await finished
    })
    expect(result.current.settings.feedUrl).toBeNull()
    expect(result.current.tasks).toEqual([])
    expect(await stored('hf2-settings')).toBeNull()
    expect(await stored('hf2-tasks')).toBeNull()
  })

  it('connecting takes over from a background refresh rather than doing nothing', async () => {
    const release = deferredFetch()
    const { result } = await boot({
      'hf2-settings': { ...SETTINGS, feedUrl: URL, feedSyncedAt: 0 },
    })
    // the launch refresh is in flight now
    await waitFor(() => expect(result.current.feed.syncing).toBe(true))
    global.fetch = jest.fn(() => Promise.resolve(respond(ics(soon)))) as unknown as typeof fetch
    let ok = false
    await act(async () => {
      ok = await result.current.connectFeed(URL)
    })
    expect(ok).toBe(true)
    await act(async () => {
      release(ics(later))
      await Promise.resolve()
    })
    // the older answer loses
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].due?.replaceAll('-', '')).toBe(soon)
  })

  it('says what went wrong with a link that is not a calendar', async () => {
    global.fetch = jest.fn(() => Promise.resolve(respond('<html>Log in</html>'))) as unknown as typeof fetch
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    await act(async () => {
      await result.current.connectFeed(URL)
    })
    expect(result.current.feed.error).toBe('not-a-calendar')
    expect(result.current.settings.feedUrl).toBeNull()
  })

  it('refreshes on launch when the last check is old, and not when it is recent', async () => {
    const fresh = jest.fn(() => Promise.resolve(respond(ics(soon))))
    global.fetch = fresh as unknown as typeof fetch
    await boot({ 'hf2-settings': { ...SETTINGS, feedUrl: URL, feedSyncedAt: Date.now() } })
    expect(fresh).not.toHaveBeenCalled()

    const { result } = await boot({ 'hf2-settings': { ...SETTINGS, feedUrl: URL, feedSyncedAt: 1 } })
    await waitFor(() => expect(fresh).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.feed.syncing).toBe(false))
  })
})

describe('what the store asks of the device', () => {
  const lastCall = <T,>(mock: unknown): T => {
    const calls = (mock as jest.Mock).mock.calls
    return calls[calls.length - 1] as T
  }

  it('keeps the time-up alert in step with the session', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a')] })

    act(() => result.current.startFocus('a'))
    await waitFor(() => expect(lastCall<[{ running: boolean }]>(syncSessionAlert)[0]?.running).toBe(true))
    const firstEnd = lastCall<[{ endsAt: number }]>(syncSessionAlert)[0].endsAt

    act(() => result.current.adjustFocus(5))
    await waitFor(() =>
      expect(lastCall<[{ endsAt: number }]>(syncSessionAlert)[0].endsAt).toBe(firstEnd + 5 * MIN)
    )

    act(() => result.current.toggleFocusRun())
    await waitFor(() => expect(lastCall<[{ running: boolean }]>(syncSessionAlert)[0]?.running).toBe(false))

    act(() => result.current.abandonFocus())
    await waitFor(() => expect(lastCall<[unknown]>(syncSessionAlert)[0]).toBeNull())
  })

  it('plays the chosen sound only while a session runs', async () => {
    const { result } = await boot({
      'hf2-settings': { ...SETTINGS, sound: 'brown' },
      'hf2-tasks': [task('a')],
    })
    expect(lastCall(syncFocusSound)).toEqual(['brown', false])

    act(() => result.current.startFocus('a'))
    await waitFor(() => expect(lastCall(syncFocusSound)).toEqual(['brown', true]))

    act(() => result.current.toggleFocusRun())
    await waitFor(() => expect(lastCall(syncFocusSound)).toEqual(['brown', false]))

    act(() => result.current.toggleFocusRun())
    act(() => result.current.updateSettings({ sound: 'waves' }))
    await waitFor(() => expect(lastCall(syncFocusSound)).toEqual(['waves', true]))
  })

  it('drops the day\'s reminder once something has been done', async () => {
    const { result } = await boot({
      'hf2-settings': { ...SETTINGS, reminderHour: 18 },
      'hf2-tasks': [task('a')],
    })
    expect(lastCall(syncReminders)).toEqual([18, false])
    act(() => result.current.completeTask('a'))
    await waitFor(() => expect(lastCall(syncReminders)).toEqual([18, true]))
  })

  it('starts light unless told otherwise, and follows the choice', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS })
    expect(lastCall(applyAppearance)).toEqual(['light'])
    act(() => result.current.updateSettings({ appearance: 'dark' }))
    await waitFor(() => expect(lastCall(applyAppearance)).toEqual(['dark']))
    act(() => result.current.resetAll())
    await waitFor(() => expect(lastCall(applyAppearance)).toEqual(['light']))
  })

  it('applies a saved choice when the app opens', async () => {
    await boot({ 'hf2-settings': { ...SETTINGS, appearance: 'system' } })
    expect(lastCall(applyAppearance)).toEqual(['system'])
  })

  it('reset clears scheduled notifications and silences sound', async () => {
    const { result } = await boot({ 'hf2-settings': SETTINGS, 'hf2-tasks': [task('a')] })
    act(() => result.current.resetAll())
    expect(clearAllNotifications).toHaveBeenCalled()
    expect(silenceFocusSound).toHaveBeenCalled()
    expect(result.current.settings.onboarded).toBe(false)
    expect(result.current.tasks).toEqual([])
  })
})

describe('the export', () => {
  it('includes what the user made and nothing private', async () => {
    const { result } = await boot({
      'hf2-settings': {
        ...SETTINGS,
        feedUrl: 'https://school.instructure.com/feeds/calendars/user_secret.ics',
        feedSyncedAt: Date.now(),
      },
      'hf2-tasks': [task('a')],
    })
    const exported = result.current.exportData()
    expect(JSON.parse(exported).tasks).toHaveLength(1)
    expect(exported).not.toContain('user_secret')
  })
})
