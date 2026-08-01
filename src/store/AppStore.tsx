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
import { Completion, DEFAULT_SETTINGS, Settings, Task } from '@/lib/types'
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
import { generateId } from '@/lib/utils'

const KEYS = {
  tasks: 'hf2-tasks',
  history: 'hf2-history',
  settings: 'hf2-settings',
  focus: 'hf2-focus',
} as const

// v1 storage keys — migrated once, then left untouched
const V1 = { tasks: 'hyperfocus-tasks', sessions: 'hyperfocus-sessions' } as const

interface FocusSession {
  taskId: string
  totalSec: number
  running: boolean
  /** epoch ms the session ends at (while running) */
  endsAt: number
  /** seconds left, snapshotted when paused */
  pausedRemaining: number
}

export interface Recap {
  title: string
  cat: Cat
  points: number
  minutes: number
}

interface Store {
  hydrated: boolean
  settings: Settings
  tasks: Task[]
  history: Completion[]

  inbox: Task[]
  today: Task[]
  later: Task[]

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

  addToInbox: (title: string) => void
  removeTask: (id: string) => void
  triageAssign: (id: string, bucket: 'today' | 'later' | 'drop') => void
  setCat: (id: string, cat: Cat) => void
  promoteToToday: (id: string) => void
  completeTask: (id: string) => void
  setFirstStep: (id: string, step: string) => void
  setDue: (id: string, due?: string) => void

  startFocus: (taskId: string) => void
  toggleFocusRun: () => void
  finishFocus: () => Recap | null
  abandonFocus: () => void

  updateSettings: (patch: Partial<Settings>) => void
  resetAll: () => void
}

const AppContext = createContext<Store | null>(null)

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) =>
    console.warn(`persist error for "${key}":`, err)
  )
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
  const [today, setToday] = useState(dayKey)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const sync = () => {
      setToday((prev) => {
        const next = dayKey()
        return next === prev ? prev : next
      })
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
  const todayKey = useTodayKey()

  // completeTask/finishFocus need current state without taking it as a
  // dependency — otherwise every action identity churns on each keystroke.
  // focusRef also acts as the guard that keeps finishFocus single-shot when
  // the countdown reaching zero races a Done tap.
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const focusRef = useRef(focus)
  focusRef.current = focus

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, t, h, f, v1t, v1s] = await Promise.all([
          AsyncStorage.getItem(KEYS.settings),
          AsyncStorage.getItem(KEYS.tasks),
          AsyncStorage.getItem(KEYS.history),
          AsyncStorage.getItem(KEYS.focus),
          AsyncStorage.getItem(V1.tasks),
          AsyncStorage.getItem(V1.sessions),
        ])
        if (cancelled) return
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) })
        if (t || h) {
          if (t) setTasks(JSON.parse(t))
          if (h) setHistory(JSON.parse(h))
        } else if (v1t || v1s) {
          const migrated = migrateV1(v1t, v1s)
          setTasks(migrated.tasks)
          setHistory(migrated.history)
          persist(KEYS.tasks, migrated.tasks)
          persist(KEYS.history, migrated.history)
        }
        // A focus session survives a cold start: endsAt is absolute epoch ms,
        // so a running timer resumes at the right place instead of vanishing.
        if (f) {
          const saved = JSON.parse(f) as FocusSession
          const stale =
            saved.running && Date.now() - saved.endsAt > 12 * 60 * 60 * 1000
          if (!stale) setFocus(saved)
          else AsyncStorage.removeItem(KEYS.focus).catch(() => {})
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
  }, [])

  const patchTasks = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = updater(prev)
      persist(KEYS.tasks, next)
      return next
    })
  }, [])

  const pushHistory = useCallback((entry: Completion) => {
    setHistory((prev) => {
      const next = [entry, ...prev]
      persist(KEYS.history, next)
      return next
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      persist(KEYS.settings, next)
      return next
    })
  }, [])

  // ---- capture / triage ----

  const addToInbox = useCallback(
    (title: string) => {
      const clean = title.trim()
      if (!clean) return
      patchTasks((prev) => [
        { id: generateId(), title: clean, bucket: 'inbox', createdAt: new Date().toISOString() },
        ...prev,
      ])
    },
    [patchTasks]
  )

  const removeTask = useCallback(
    (id: string) => patchTasks((prev) => prev.filter((t) => t.id !== id)),
    [patchTasks]
  )

  const triageAssign = useCallback(
    (id: string, bucket: 'today' | 'later' | 'drop') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      if (bucket === 'drop') {
        removeTask(id)
        return
      }
      patchTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, bucket, cat: t.cat ?? 'sprint' } : t
        )
      )
    },
    [patchTasks, removeTask]
  )

  const setCat = useCallback(
    (id: string, cat: Cat) => {
      patchTasks((prev) => prev.map((t) => (t.id === id ? { ...t, cat } : t)))
    },
    [patchTasks]
  )

  const promoteToToday = useCallback(
    (id: string) =>
      patchTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, bucket: 'today' as const } : t))
      ),
    [patchTasks]
  )

  const setFirstStep = useCallback(
    (id: string, step: string) =>
      patchTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, firstStep: step.trim() } : t))
      ),
    [patchTasks]
  )

  const setDue = useCallback(
    (id: string, due?: string) =>
      patchTasks((prev) => prev.map((t) => (t.id === id ? { ...t, due } : t))),
    [patchTasks]
  )

  const completeTask = useCallback(
    (id: string) => {
      const task = tasksRef.current.find((t) => t.id === id)
      if (!task) return
      const cat = task.cat ?? 'sprint'
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      pushHistory({
        id: generateId(),
        title: task.title,
        cat,
        points: scoreCompletion(cat, 0),
        minutes: 0,
        completedAt: new Date().toISOString(),
      })
      removeTask(id)
    },
    [pushHistory, removeTask]
  )

  // ---- focus session ----

  // one writer for the session so every path persists
  const writeFocus = useCallback((next: FocusSession | null) => {
    setFocus(next)
    if (next) persist(KEYS.focus, next)
    else AsyncStorage.removeItem(KEYS.focus).catch(() => {})
  }, [])

  const startFocus = useCallback(
    (taskId: string) => {
      const totalSec = settings.focusLen * 60
      setLastRecap(null)
      writeFocus({
        taskId,
        totalSec,
        running: true,
        endsAt: Date.now() + totalSec * 1000,
        pausedRemaining: totalSec,
      })
    },
    [settings.focusLen, writeFocus]
  )

  const toggleFocusRun = useCallback(() => {
    setFocus((prev) => {
      if (!prev) return prev
      const next = prev.running
        ? {
            ...prev,
            running: false,
            pausedRemaining: Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000)),
          }
        : { ...prev, running: true, endsAt: Date.now() + prev.pausedRemaining * 1000 }
      persist(KEYS.focus, next)
      return next
    })
  }, [])

  const finishFocus = useCallback((): Recap | null => {
    const current = focusRef.current
    if (!current) return null
    // guard: the timer hitting zero and a Done tap can race
    focusRef.current = null

    const remaining = current.running
      ? Math.max(0, Math.round((current.endsAt - Date.now()) / 1000))
      : current.pausedRemaining
    const minutes = Math.max(1, Math.round((current.totalSec - remaining) / 60))
    const task = tasksRef.current.find((t) => t.id === current.taskId)
    const cat: Cat = task?.cat ?? 'sprint'
    const points = scoreCompletion(cat, minutes)
    const recap: Recap = { title: task?.title ?? 'Focus session', cat, points, minutes }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    pushHistory({
      id: generateId(),
      title: recap.title,
      cat,
      points,
      minutes,
      completedAt: new Date().toISOString(),
    })
    if (task) removeTask(task.id)
    writeFocus(null)
    setLastRecap(recap)
    return recap
  }, [pushHistory, removeTask, writeFocus])

  const abandonFocus = useCallback(() => {
    focusRef.current = null
    writeFocus(null)
  }, [writeFocus])

  const resetAll = useCallback(() => {
    AsyncStorage.multiRemove([...Object.values(KEYS), ...Object.values(V1)]).catch(() => {})
    setTasks([])
    setHistory([])
    setSettings(DEFAULT_SETTINGS)
    focusRef.current = null
    setFocus(null)
    setLastRecap(null)
  }, [])

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

  const inbox = useMemo(() => tasks.filter((t) => t.bucket === 'inbox'), [tasks])
  const today = useMemo(() => tasks.filter((t) => t.bucket === 'today'), [tasks])
  const later = useMemo(() => tasks.filter((t) => t.bucket === 'later'), [tasks])
  const focusTask = useMemo(
    () => (focus ? tasks.find((t) => t.id === focus.taskId) ?? null : null),
    [focus, tasks]
  )

  // memoized so consumers only re-render when state actually changes
  const value: Store = useMemo(
    () => ({
      hydrated,
      settings,
      tasks,
      history,
      inbox,
      today,
      later,
      ...derived,
      focus,
      focusTask,
      lastRecap,
      addToInbox,
      removeTask,
      triageAssign,
      setCat,
      promoteToToday,
      completeTask,
      setFirstStep,
      setDue,
      startFocus,
      toggleFocusRun,
      finishFocus,
      abandonFocus,
      updateSettings,
      resetAll,
    }),
    [
      hydrated,
      settings,
      tasks,
      history,
      inbox,
      today,
      later,
      derived,
      focus,
      focusTask,
      lastRecap,
      addToInbox,
      removeTask,
      triageAssign,
      setCat,
      promoteToToday,
      completeTask,
      setFirstStep,
      setDue,
      startFocus,
      toggleFocusRun,
      finishFocus,
      abandonFocus,
      updateSettings,
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
