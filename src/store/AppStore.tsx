import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { Cat } from '@/lib/theme'
import { Completion, DEFAULT_SETTINGS, Settings, Task, loadSettings } from '@/lib/types'
import {
  DayTotals,
  RaceField,
  WeekSummary,
  buildRaceField,
  dayKey,
  daysAway,
  levelForPoints,
  scoreCompletion,
  showedUpCount,
  summarize,
  totalsByDay,
  weekBars,
  WeekBar,
} from '@/lib/points'
import {
  FocusSession,
  adjustSession,
  completedStamp,
  focusedMinutes,
  hasExpired,
  isStaleExpired,
  newSession,
  pauseSession,
  resumeSession,
} from '@/lib/session'
import { MAX_TITLE, isOverdue, rankForStart, splitBuckets } from '@/lib/tasks'
import { FEED_REFRESH_MS, FeedError, fetchFeed, mergeFeed, normalizeFeedUrl } from '@/lib/feed'
import {
  clearAllNotifications,
  requestNotifications,
  syncReminders,
  syncSessionAlert,
} from '@/lib/notifications'
import { silenceFocusSound, syncFocusSound } from '@/lib/sound'
import { applyAppearance } from '@/lib/appearance'
import { generateId } from '@/lib/utils'

const KEYS = {
  tasks: 'hf2-tasks',
  history: 'hf2-history',
  settings: 'hf2-settings',
  focus: 'hf2-focus',
  feedSeen: 'hf2-feed-seen',
} as const

// v1 storage keys — migrated once, then left untouched
const V1 = { tasks: 'hyperfocus-tasks', sessions: 'hyperfocus-sessions' } as const

export type { FocusSession } from '@/lib/session'

export interface Recap {
  title: string
  cat: Cat
  points: number
  minutes: number
  /**
   * The user said it's finished, the clock ran out and it's still their call, or
   * they stopped part-way and the task plainly isn't finished.
   */
  ended: 'done' | 'expired' | 'stopped'
  taskId: string
  /** the task as it was, so a finished one can be put back */
  task?: Task
  /** the history entry this session wrote, so it can be taken back */
  entryId: string
}

/** How a session is being closed. */
export type FinishMode = Recap['ended'] | 'banked'

export interface UndoOffer {
  id: number
  message: string
}

export interface FeedStatus {
  syncing: boolean
  error: FeedError | 'invalid' | null
  /** how many new items the last sync brought in, null before the first */
  added: number | null
  /** how many deadlines the last sync moved */
  moved: number
}

const FEED_IDLE: FeedStatus = { syncing: false, error: null, added: null, moved: 0 }

/** How long a way back is on offer. */
const UNDO_MS = 5000

interface NewTaskOptions {
  due?: string
  bucket?: Task['bucket']
}

interface Store {
  hydrated: boolean
  settings: Settings
  tasks: Task[]
  history: Completion[]

  inbox: Task[]
  today: Task[]
  later: Task[]
  /** Today in the order "Start one thing" offers it */
  upNext: Task[]
  overdue: Task[]

  /** YYYY-MM-DD, kept live across midnight and app resume */
  todayKey: string
  byDay: Map<string, DayTotals>
  todayTotals: DayTotals
  race: RaceField
  /** days active in the last 28 — never resets on a miss */
  showedUp: number
  /** days since the last active day, null if today already counts */
  away: number | null
  /** what the last 7 days contained — the debrief's opening */
  week: WeekSummary
  level: number
  companionLevel: number
  ahead: boolean
  bars: WeekBar[]

  focus: FocusSession | null
  focusTask: Task | null
  lastRecap: Recap | null
  /** a session ended somewhere and its recap hasn't been shown yet */
  recapPending: boolean
  undoOffer: UndoOffer | null
  feed: FeedStatus

  addToInbox: (title: string) => void
  /**
   * Add directly, for when the when is already known and triage has nothing to
   * ask. Returns the new task's id, or null if there was nothing to add.
   */
  addTask: (title: string, options?: NewTaskOptions) => string | null
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  removeTask: (id: string) => void
  /** remove with a way back */
  letGo: (id: string) => void
  triageAssign: (id: string, bucket: 'today' | 'later' | 'drop') => void
  completeTask: (id: string) => void
  undo: () => void

  /** `minutes` overrides the usual session length for this one session */
  startFocus: (taskId: string, minutes?: number) => void
  /** bank what the running session earned, keep its task, start on another */
  switchFocus: (taskId: string, minutes?: number) => void
  toggleFocusRun: () => void
  adjustFocus: (deltaMin: number) => void
  finishFocus: (mode?: FinishMode) => Recap | null
  abandonFocus: () => void

  acknowledgeRecap: () => void
  /** after a "done" recap: it wasn't really finished, put it back on Today */
  putBackRecapTask: () => void
  /** after an "expired" recap: yes, it's finished */
  finishRecapTask: () => void
  /** after a "stopped" recap: those minutes weren't real work, don't count them */
  discardRecapSession: () => void

  updateSettings: (patch: Partial<Settings>) => void
  connectFeed: (raw: string) => Promise<boolean>
  syncFeed: () => Promise<boolean>
  disconnectFeed: () => void
  exportData: () => string
  resetAll: () => void
}

const AppContext = createContext<Store | null>(null)

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) =>
    console.warn(`persist error for "${key}":`, err)
  )
}

/** A stored object, or null if it's missing or unreadable. */
function parseObject<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch (err) {
    console.warn('stored value unreadable:', err)
    return null
  }
}

/** A stored list, or null if it's missing or isn't one. */
function parseList<T>(raw: string | null): T[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch (err) {
    console.warn('stored list unreadable:', err)
    return null
  }
}

/** Map v1 data (dark-theme era) into the v2 model so nobody loses their tasks. */
function migrateV1(rawTasks: string | null, rawSessions: string | null): {
  tasks: Task[]
  history: Completion[]
} {
  const tasks: Task[] = []
  const history: Completion[] = []
  const catFromV1 = (type?: string): Cat => (type === 'deep' ? 'grind' : 'sprint')
  try {
    if (rawTasks) {
      for (const t of JSON.parse(rawTasks) as any[]) {
        if (!t?.title) continue
        if (t.completed && t.completedAt) {
          const cat = catFromV1(t.type)
          history.push({
            id: t.id ?? generateId(),
            title: t.title,
            cat,
            points: scoreCompletion(cat, 0),
            minutes: 0,
            completedAt: t.completedAt,
          })
        } else if (!t.completed) {
          tasks.push({
            id: t.id ?? generateId(),
            title: t.title,
            cat: catFromV1(t.type),
            bucket: t.category === 'today' ? 'today' : 'later',
            createdAt: t.createdAt ?? new Date().toISOString(),
          })
        }
      }
    }
    if (rawSessions) {
      for (const s of JSON.parse(rawSessions) as any[]) {
        if (!s?.completedAt || !s?.actualDuration) continue
        const minutes = Math.max(1, Math.round(s.actualDuration / 60))
        history.push({
          id: s.id ?? generateId(),
          title: s.taskTitle ?? 'Focus session',
          cat: 'sprint',
          points: scoreCompletion('sprint', minutes),
          minutes,
          completedAt: s.completedAt,
        })
      }
    }
  } catch (err) {
    console.warn('v1 migration skipped:', err)
  }
  return { tasks, history }
}

/**
 * The current day key, kept honest.
 *
 * Deriving `dayKey()` inside a memo froze "today" at whatever it was when the
 * app launched, so an app left open overnight kept scoring into yesterday.
 * This re-checks on resume and schedules a wake-up for the next local midnight.
 */
function useTodayKey(): string {
  const [today, setToday] = useState(() => dayKey())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const sync = () => {
      setToday(dayKey())
      schedule()
    }

    const schedule = () => {
      clearTimeout(timer)
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      // +1s of slack so we land firmly inside the new day
      timer = setTimeout(sync, midnight.getTime() - now.getTime() + 1000)
    }

    schedule()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') sync()
    })
    return () => {
      clearTimeout(timer)
      sub.remove()
    }
  }, [])

  return today
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<Completion[]>([])
  const [focus, setFocus] = useState<FocusSession | null>(null)
  const [lastRecap, setLastRecap] = useState<Recap | null>(null)
  const [recapPending, setRecapPending] = useState(false)
  const [undoOffer, setUndoOffer] = useState<UndoOffer | null>(null)
  const [feed, setFeed] = useState<FeedStatus>(FEED_IDLE)
  const todayKey = useTodayKey()

  // Actions need current state without taking it as a dependency — otherwise
  // every action identity churns on each keystroke. focusRef also acts as the
  // guard that keeps finishFocus single-shot when the clock reaching zero races
  // a Done tap.
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const historyRef = useRef(history)
  historyRef.current = history
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const focusRef = useRef(focus)
  focusRef.current = focus
  const undoRef = useRef<(() => void) | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedSeenRef = useRef<string[]>([])
  const feedBusyRef = useRef(false)
  const feedRunRef = useRef(0)

  // The refs are updated here as well as on render, so an action that follows an
  // edit in the same tap sees it. Saving a typed title and then starting a session
  // would otherwise snapshot the old title.
  const patchTasks = useCallback((updater: (prev: Task[]) => Task[]) => {
    const next = updater(tasksRef.current)
    if (next === tasksRef.current) return
    tasksRef.current = next
    setTasks(next)
    persist(KEYS.tasks, next)
  }, [])

  const patchHistory = useCallback((updater: (prev: Completion[]) => Completion[]) => {
    const next = updater(historyRef.current)
    if (next === historyRef.current) return
    historyRef.current = next
    setHistory(next)
    persist(KEYS.history, next)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      persist(KEYS.settings, next)
      return next
    })
  }, [])

  // ---- undo ----

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = null
    undoRef.current = null
    setUndoOffer(null)
  }, [])

  const offerUndo = useCallback(
    (message: string, restore: () => void) => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
      undoRef.current = restore
      setUndoOffer({ id: Date.now(), message })
      undoTimer.current = setTimeout(clearUndo, UNDO_MS)
    },
    [clearUndo]
  )

  const undo = useCallback(() => {
    const restore = undoRef.current
    clearUndo()
    restore?.()
  }, [clearUndo])

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    },
    []
  )

  /** Put a task back where it was, not just at the top of the pile. */
  const restoreTask = useCallback(
    (task: Task, index: number) =>
      patchTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev
        const next = [...prev]
        next.splice(Math.min(Math.max(index, 0), next.length), 0, task)
        return next
      }),
    [patchTasks]
  )

  // ---- capture / triage / edit ----

  const addToInbox = useCallback(
    (title: string) => {
      const clean = title.trim().slice(0, MAX_TITLE)
      if (!clean) return
      patchTasks((prev) => [
        { id: generateId(), title: clean, bucket: 'inbox', createdAt: new Date().toISOString() },
        ...prev,
      ])
    },
    [patchTasks]
  )

  const addTask = useCallback(
    (title: string, options: NewTaskOptions = {}) => {
      const clean = title.trim().slice(0, MAX_TITLE)
      if (!clean) return null
      const id = generateId()
      patchTasks((prev) => [
        {
          id,
          title: clean,
          cat: 'sprint',
          bucket: options.bucket ?? 'later',
          due: options.due,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      return id
    },
    [patchTasks]
  )

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) =>
      patchTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [patchTasks]
  )

  const removeTask = useCallback(
    (id: string) => patchTasks((prev) => prev.filter((t) => t.id !== id)),
    [patchTasks]
  )

  const letGo = useCallback(
    (id: string) => {
      const index = tasksRef.current.findIndex((t) => t.id === id)
      if (index < 0) return
      const task = tasksRef.current[index]
      removeTask(id)
      offerUndo(`Let go of "${task.title}"`, () => restoreTask(task, index))
    },
    [removeTask, offerUndo, restoreTask]
  )

  const triageAssign = useCallback(
    (id: string, bucket: 'today' | 'later' | 'drop') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      if (bucket === 'drop') {
        letGo(id)
        return
      }
      patchTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, bucket, cat: t.cat ?? 'sprint' } : t))
      )
    },
    [patchTasks, letGo]
  )

  // ---- focus session ----

  // one writer for the session so every path persists
  const writeFocus = useCallback((next: FocusSession | null) => {
    focusRef.current = next
    setFocus(next)
    if (next) persist(KEYS.focus, next)
    else AsyncStorage.removeItem(KEYS.focus).catch(() => {})
  }, [])

  const finishFocus = useCallback(
    (mode: FinishMode = 'done'): Recap | null => {
      const current = focusRef.current
      if (!current) return null
      // guard: the clock hitting zero and a Done tap can race
      focusRef.current = null

      const now = Date.now()
      const task = tasksRef.current.find((t) => t.id === current.taskId)
      const cat: Cat = task?.cat ?? current.cat ?? 'sprint'
      const title = task?.title ?? current.title ?? 'Focus session'
      const minutes = focusedMinutes(current, now)
      const points = scoreCompletion(cat, minutes)
      const entryId = generateId()

      patchHistory((prev) => [
        { id: entryId, title, cat, points, minutes, completedAt: completedStamp(current, now) },
        ...prev,
      ])
      writeFocus(null)
      if (mode === 'banked') return null

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      // The clock running out doesn't mean the work did. A 25-minute timer ending
      // on "write essay" must not quietly delete "write essay", so only a Done
      // tap removes the task. An expired session asks on the recap instead.
      if (mode === 'done' && task) removeTask(task.id)
      const recap: Recap = {
        title,
        cat,
        points,
        minutes,
        ended: mode,
        taskId: current.taskId,
        task,
        entryId,
      }
      setLastRecap(recap)
      setRecapPending(true)
      return recap
    },
    [patchHistory, removeTask, writeFocus]
  )

  const completeTask = useCallback(
    (id: string) => {
      // Checking off the task a session is running on is finishing that session.
      // Handling it separately would score the same work twice and strand a clock
      // running on a task that no longer exists.
      if (focusRef.current?.taskId === id) {
        finishFocus('done')
        return
      }
      const index = tasksRef.current.findIndex((t) => t.id === id)
      if (index < 0) return
      const task = tasksRef.current[index]
      const cat = task.cat ?? 'sprint'
      const points = scoreCompletion(cat, 0)
      const entryId = generateId()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      patchHistory((prev) => [
        {
          id: entryId,
          title: task.title,
          cat,
          points,
          minutes: 0,
          completedAt: new Date().toISOString(),
        },
        ...prev,
      ])
      removeTask(id)
      offerUndo(`Done. +${points} pts`, () => {
        patchHistory((prev) => prev.filter((c) => c.id !== entryId))
        restoreTask(task, index)
      })
    },
    [finishFocus, patchHistory, removeTask, offerUndo, restoreTask]
  )

  const startFocus = useCallback(
    (taskId: string, minutes?: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId)
      if (!task) return
      setLastRecap(null)
      setRecapPending(false)
      const session = newSession(task, minutes ?? settingsRef.current.focusLen, Date.now())
      writeFocus(session)
      // Asked here rather than at launch: the very first session is the moment
      // the reason for the question is obvious. The timer doesn't wait on it.
      requestNotifications().then((granted) => {
        if (granted) syncSessionAlert(focusRef.current)
      })
    },
    [writeFocus]
  )

  const switchFocus = useCallback(
    (taskId: string, minutes?: number) => {
      // the alert asking about this can outlive the task it's offering to switch
      // to, and ending the running session for nothing would be the worse outcome
      if (!tasksRef.current.some((t) => t.id === taskId)) return
      finishFocus('banked')
      startFocus(taskId, minutes)
    },
    [finishFocus, startFocus]
  )

  const toggleFocusRun = useCallback(() => {
    const current = focusRef.current
    if (!current) return
    const now = Date.now()
    writeFocus(current.running ? pauseSession(current, now) : resumeSession(current, now))
  }, [writeFocus])

  const adjustFocus = useCallback(
    (deltaMin: number) => {
      const current = focusRef.current
      if (!current) return
      const next = adjustSession(current, deltaMin, Date.now())
      if (next !== current) writeFocus(next)
    },
    [writeFocus]
  )

  const abandonFocus = useCallback(() => writeFocus(null), [writeFocus])

  const acknowledgeRecap = useCallback(() => setRecapPending(false), [])

  const putBackRecapTask = useCallback(() => {
    const task = lastRecap?.task
    if (task) restoreTask({ ...task, bucket: 'today' }, 0)
  }, [lastRecap, restoreTask])

  const finishRecapTask = useCallback(() => {
    if (lastRecap) removeTask(lastRecap.taskId)
  }, [lastRecap, removeTask])

  // Stopping early counts the minutes straight away and offers this on the recap,
  // rather than asking "are you sure?" before stopping. The common case, real work
  // cut short, then costs no extra tap, and the rare one, a clock left running on
  // an empty desk, is one tap to take back.
  const discardRecapSession = useCallback(() => {
    if (!lastRecap) return
    const { entryId } = lastRecap
    patchHistory((prev) => prev.filter((c) => c.id !== entryId))
    setLastRecap(null)
    setRecapPending(false)
  }, [lastRecap, patchHistory])

  // ---- calendar feed ----

  const runFeedSync = useCallback(
    async (url: string, supersede = false): Promise<boolean> => {
      if (feedBusyRef.current && !supersede) return false
      const run = ++feedRunRef.current
      feedBusyRef.current = true
      setFeed((f) => ({ ...f, syncing: true, error: null }))
      try {
        const events = await fetchFeed(url)
        // Disconnected or reset while this was in flight. What came back is no
        // longer wanted, and saving it would restore a link the user just removed.
        if (run !== feedRunRef.current) return false
        const result = mergeFeed({
          tasks: tasksRef.current,
          seen: feedSeenRef.current,
          events,
          today: dayKey(),
          now: Date.now(),
          url,
        })
        if (result.tasks !== tasksRef.current) patchTasks(() => result.tasks)
        if (result.seen !== feedSeenRef.current) {
          feedSeenRef.current = result.seen
          persist(KEYS.feedSeen, result.seen)
        }
        updateSettings({ feedUrl: url, feedSyncedAt: Date.now() })
        setFeed({ syncing: false, error: null, added: result.added, moved: result.updated })
        return true
      } catch (err) {
        if (run === feedRunRef.current) {
          setFeed((f) => ({ ...f, syncing: false, error: err as FeedError }))
        }
        return false
      } finally {
        if (run === feedRunRef.current) feedBusyRef.current = false
      }
    },
    [patchTasks, updateSettings]
  )

  const cancelFeedSync = useCallback(() => {
    feedRunRef.current += 1
    feedBusyRef.current = false
  }, [])

  const connectFeed = useCallback(
    async (raw: string) => {
      const url = normalizeFeedUrl(raw)
      if (!url) {
        setFeed((f) => ({ ...f, error: 'invalid' }))
        return false
      }
      // takes over from any background refresh, which would otherwise make this
      // tap do nothing and say nothing
      return runFeedSync(url, true)
    },
    [runFeedSync]
  )

  const syncFeed = useCallback(async () => {
    const url = settingsRef.current.feedUrl
    return url ? runFeedSync(url) : false
  }, [runFeedSync])

  const disconnectFeed = useCallback(() => {
    cancelFeedSync()
    updateSettings({ feedUrl: null, feedSyncedAt: null })
    setFeed(FEED_IDLE)
  }, [cancelFeedSync, updateSettings])

  // ---- data ----

  const exportData = useCallback(
    () =>
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          tasks: tasksRef.current,
          history: historyRef.current,
        },
        null,
        2
      ),
    []
  )

  const resetAll = useCallback(() => {
    AsyncStorage.multiRemove([...Object.values(KEYS), ...Object.values(V1)]).catch(() => {})
    clearAllNotifications()
    silenceFocusSound()
    cancelFeedSync()
    clearUndo()
    tasksRef.current = []
    historyRef.current = []
    setTasks([])
    setHistory([])
    setSettings(DEFAULT_SETTINGS)
    focusRef.current = null
    setFocus(null)
    setLastRecap(null)
    setRecapPending(false)
    feedSeenRef.current = []
    setFeed(FEED_IDLE)
  }, [cancelFeedSync, clearUndo])

  // ---- hydrate ----

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, t, h, f, seen, v1t, v1s] = await Promise.all([
          AsyncStorage.getItem(KEYS.settings),
          AsyncStorage.getItem(KEYS.tasks),
          AsyncStorage.getItem(KEYS.history),
          AsyncStorage.getItem(KEYS.focus),
          AsyncStorage.getItem(KEYS.feedSeen),
          AsyncStorage.getItem(V1.tasks),
          AsyncStorage.getItem(V1.sessions),
        ])
        if (cancelled) return

        // Each value is read on its own. One unreadable value must only cost that
        // value: an abort here would leave the lists empty in memory, and the next
        // task added would save that emptiness over everything still on disk.
        const storedSettings = parseObject<Partial<Settings> & Record<string, unknown>>(s)
        if (storedSettings) {
          setSettings(loadSettings(storedSettings))
        } else if (s) {
          // they've clearly been here before, so don't greet them with the welcome
          setSettings({ ...DEFAULT_SETTINGS, onboarded: true })
        }

        const storedTasks = parseList<Task>(t)
        const storedHistory = parseList<Completion>(h)
        if (storedTasks) {
          tasksRef.current = storedTasks
          setTasks(storedTasks)
        }
        if (storedHistory) {
          historyRef.current = storedHistory
          setHistory(storedHistory)
        }
        // Migrating goes by whether the v2 keys exist, not whether they could be
        // read. Unreadable v2 data must not be replaced with years-old v1 data.
        if (t == null && h == null && (v1t || v1s)) {
          const migrated = migrateV1(v1t, v1s)
          patchTasks(() => migrated.tasks)
          patchHistory(() => migrated.history)
        }
        feedSeenRef.current = parseList<string>(seen) ?? []

        // A focus session survives a cold start: endsAt is absolute epoch ms, so
        // a running timer resumes at the right place instead of vanishing. One
        // that ran out long ago still earned its minutes, but they're banked
        // quietly rather than opening the app on a recap for something forgotten.
        const saved = parseObject<FocusSession>(f)
        if (saved?.taskId && typeof saved.endsAt === 'number') {
          focusRef.current = saved
          if (isStaleExpired(saved, Date.now())) finishFocus('banked')
          else setFocus(saved)
        }
      } catch (err) {
        console.warn('hydrate error:', err)
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // runs once; these callbacks are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- background work ----

  // The one place a session's clock is watched, so it ends wherever the user is,
  // not just on the Focus screen. A single timer aimed at the end, rather than a
  // tick, keeps the whole app from re-rendering every second. Timers are frozen
  // while the app is suspended, hence the check on resume.
  const running = focus?.running ?? false
  const endsAt = focus?.endsAt
  useEffect(() => {
    if (!hydrated || !running || endsAt == null) return
    const check = () => {
      const current = focusRef.current
      if (current && hasExpired(current, Date.now())) finishFocus('expired')
    }
    check()
    const timer = setTimeout(check, Math.max(0, endsAt - Date.now()) + 50)
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check()
    })
    return () => {
      clearTimeout(timer)
      sub.remove()
    }
  }, [hydrated, running, endsAt, finishFocus])

  // keep the scheduled "time's up" and the sound in step with the session
  const totalSec = focus?.totalSec
  useEffect(() => {
    if (!hydrated) return
    syncSessionAlert(focusRef.current)
  }, [hydrated, running, endsAt, totalSec])

  useEffect(() => {
    if (!hydrated) return
    syncFocusSound(settings.sound, running)
  }, [hydrated, running, settings.sound])

  useEffect(() => {
    if (hydrated) applyAppearance(settings.appearance)
  }, [hydrated, settings.appearance])

  // ---- derived ----

  const derived = useMemo(() => {
    const byDay = totalsByDay(history)
    const todayTotals = byDay.get(todayKey) ?? { points: 0, completed: 0, minutes: 0 }
    const race = buildRaceField(byDay, todayKey, todayTotals.points)
    const level = levelForPoints(todayTotals.points)
    return {
      todayKey,
      byDay,
      todayTotals,
      race,
      showedUp: showedUpCount(byDay, todayKey),
      away: daysAway(byDay, todayKey),
      week: summarize(byDay, todayKey),
      level,
      // the companion reflects your typical self, so it never shrinks back on
      // a quiet morning — growth you earned stays earned
      companionLevel: Math.max(level, levelForPoints(race.pacer)),
      ahead: race.ahead,
      bars: weekBars(byDay, todayKey),
    }
  }, [history, todayKey])

  const feedUrl = settings.feedUrl
  useEffect(() => {
    if (!hydrated || !feedUrl) return
    const refresh = () => {
      const age = Date.now() - (settingsRef.current.feedSyncedAt ?? 0)
      if (age > FEED_REFRESH_MS) runFeedSync(feedUrl)
    }
    refresh()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh()
    })
    return () => sub.remove()
  }, [hydrated, feedUrl, runFeedSync])

  const buckets = useMemo(() => splitBuckets(tasks, todayKey), [tasks, todayKey])
  const upNext = useMemo(() => rankForStart(buckets.today, todayKey), [buckets.today, todayKey])
  const overdue = useMemo(() => tasks.filter((t) => isOverdue(t, todayKey)), [tasks, todayKey])
  const focusTask = useMemo(
    () => (focus ? tasks.find((t) => t.id === focus.taskId) ?? null : null),
    [focus, tasks]
  )

  // Rebuilt when the hour changes, when a new day starts, and when today gets its
  // first completion (which is what cancels today's nudge). Also on every return to
  // the app: that's what rolls the week forward, and it picks up notifications being
  // turned on in Settings, which nothing else would notice.
  //
  // A running session counts as having started today. A nudge to begin something,
  // arriving while you're in the middle of something, is an interruption the app
  // would be causing itself. And the next nudge names what Home would offer, so it
  // is rebuilt when that changes.
  const quietToday = derived.todayTotals.completed > 0 || running
  const nudgeTitle = upNext[0]?.title
  const nudgeStep = upNext[0]?.firstStep
  useEffect(() => {
    if (!hydrated) return
    const sync = () =>
      syncReminders(
        settings.reminderHour,
        quietToday,
        nudgeTitle ? { title: nudgeTitle, firstStep: nudgeStep } : null
      )
    sync()
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return
      sync()
      syncSessionAlert(focusRef.current)
    })
    return () => sub.remove()
  }, [hydrated, settings.reminderHour, quietToday, todayKey, nudgeTitle, nudgeStep])

  // memoized so consumers only re-render when state actually changes
  const value: Store = useMemo(
    () => ({
      hydrated,
      settings,
      tasks,
      history,
      ...buckets,
      upNext,
      overdue,
      ...derived,
      focus,
      focusTask,
      lastRecap,
      recapPending,
      undoOffer,
      feed,
      addToInbox,
      addTask,
      updateTask,
      removeTask,
      letGo,
      triageAssign,
      completeTask,
      undo,
      startFocus,
      switchFocus,
      toggleFocusRun,
      adjustFocus,
      finishFocus,
      abandonFocus,
      acknowledgeRecap,
      putBackRecapTask,
      finishRecapTask,
      discardRecapSession,
      updateSettings,
      connectFeed,
      syncFeed,
      disconnectFeed,
      exportData,
      resetAll,
    }),
    [
      hydrated,
      settings,
      tasks,
      history,
      buckets,
      upNext,
      overdue,
      derived,
      focus,
      focusTask,
      lastRecap,
      recapPending,
      undoOffer,
      feed,
      addToInbox,
      addTask,
      updateTask,
      removeTask,
      letGo,
      triageAssign,
      completeTask,
      undo,
      startFocus,
      switchFocus,
      toggleFocusRun,
      adjustFocus,
      finishFocus,
      abandonFocus,
      acknowledgeRecap,
      putBackRecapTask,
      finishRecapTask,
      discardRecapSession,
      updateSettings,
      connectFeed,
      syncFeed,
      disconnectFeed,
      exportData,
      resetAll,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Store {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
