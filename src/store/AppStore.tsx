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
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { Cat, CAT_ORDER } from '@/lib/theme'
import { Completion, DEFAULT_SETTINGS, Settings, Task } from '@/lib/types'
import {
  DayTotals,
  dayKey,
  levelForPoints,
  pickBaseline,
  scoreCompletion,
  showedUpStreak,
  totalsByDay,
  weekBars,
  WeekBar,
} from '@/lib/points'
import { generateId } from '@/lib/utils'

const KEYS = {
  tasks: 'hf2-tasks',
  history: 'hf2-history',
  settings: 'hf2-settings',
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

  byDay: Map<string, DayTotals>
  todayTotals: DayTotals
  baseline: { day: string; totals: DayTotals } | null
  streak: number
  level: number
  companionLevel: number
  ahead: boolean
  bars: WeekBar[]

  focus: FocusSession | null
  focusRemaining: number
  focusTask: Task | null
  lastRecap: Recap | null

  addToInbox: (title: string) => void
  removeTask: (id: string) => void
  triageAssign: (id: string, bucket: 'today' | 'later' | 'drop') => void
  cycleCat: (id: string) => void
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<Completion[]>([])
  const [focus, setFocus] = useState<FocusSession | null>(null)
  const [lastRecap, setLastRecap] = useState<Recap | null>(null)
  // ticks once a second while focusing so remaining-time renders stay live
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, t, h, v1t, v1s] = await Promise.all([
          AsyncStorage.getItem(KEYS.settings),
          AsyncStorage.getItem(KEYS.tasks),
          AsyncStorage.getItem(KEYS.history),
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

  const cycleCat = useCallback(
    (id: string) => {
      patchTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const idx = CAT_ORDER.indexOf(t.cat ?? 'sprint')
          return { ...t, cat: CAT_ORDER[(idx + 1) % CAT_ORDER.length] }
        })
      )
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
      const task = tasks.find((t) => t.id === id)
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
    [tasks, pushHistory, removeTask]
  )

  // ---- focus session ----

  // intentionally recomputed every render — the 1 Hz tick below drives it
  const focusRemaining = !focus
    ? 0
    : focus.running
      ? Math.max(0, Math.round((focus.endsAt - Date.now()) / 1000))
      : focus.pausedRemaining

  const startFocus = useCallback(
    (taskId: string) => {
      const totalSec = settings.focusLen * 60
      setLastRecap(null)
      setFocus({
        taskId,
        totalSec,
        running: true,
        endsAt: Date.now() + totalSec * 1000,
        pausedRemaining: totalSec,
      })
    },
    [settings.focusLen]
  )

  const toggleFocusRun = useCallback(() => {
    setFocus((prev) => {
      if (!prev) return prev
      if (prev.running) {
        const remaining = Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000))
        return { ...prev, running: false, pausedRemaining: remaining }
      }
      return { ...prev, running: true, endsAt: Date.now() + prev.pausedRemaining * 1000 }
    })
  }, [])

  const finishFocus = useCallback((): Recap | null => {
    if (!focus) return null
    const remaining = focus.running
      ? Math.max(0, Math.round((focus.endsAt - Date.now()) / 1000))
      : focus.pausedRemaining
    const minutes = Math.max(1, Math.round((focus.totalSec - remaining) / 60))
    const task = tasks.find((t) => t.id === focus.taskId)
    const cat: Cat = task?.cat ?? 'sprint'
    const points = scoreCompletion(cat, minutes)
    const recap: Recap = {
      title: task?.title ?? 'Focus session',
      cat,
      points,
      minutes,
    }
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
    setFocus(null)
    setLastRecap(recap)
    return recap
  }, [focus, tasks, pushHistory, removeTask])

  const abandonFocus = useCallback(() => setFocus(null), [])

  // 1 Hz heartbeat while a session runs — auto-completes at zero
  const finishRef = useRef(finishFocus)
  finishRef.current = finishFocus
  useEffect(() => {
    if (!focus?.running) return
    const iv = setInterval(() => {
      setTick((n) => n + 1)
      if (Date.now() >= focus.endsAt) finishRef.current()
    }, 1000)
    return () => clearInterval(iv)
  }, [focus])

  const resetAll = useCallback(() => {
    AsyncStorage.multiRemove([...Object.values(KEYS), ...Object.values(V1)]).catch(() => {})
    setTasks([])
    setHistory([])
    setSettings(DEFAULT_SETTINGS)
    setFocus(null)
    setLastRecap(null)
  }, [])

  // ---- derived ----

  const derived = useMemo(() => {
    const today = dayKey()
    const byDay = totalsByDay(history)
    const todayTotals = byDay.get(today) ?? { points: 0, completed: 0, minutes: 0 }
    const baseline = pickBaseline(byDay, today)
    const level = levelForPoints(todayTotals.points)
    const pastLevel = baseline ? levelForPoints(baseline.totals.points) : 0
    return {
      byDay,
      todayTotals,
      baseline,
      streak: showedUpStreak(byDay, today),
      level,
      // cumulative feel — the companion never regresses below yesterday
      companionLevel: Math.max(level, pastLevel),
      ahead:
        todayTotals.points > 0 &&
        (!baseline || todayTotals.points >= baseline.totals.points),
      bars: weekBars(byDay, today),
    }
  }, [history])

  const inbox = useMemo(() => tasks.filter((t) => t.bucket === 'inbox'), [tasks])
  const today = useMemo(() => tasks.filter((t) => t.bucket === 'today'), [tasks])
  const later = useMemo(() => tasks.filter((t) => t.bucket === 'later'), [tasks])
  const focusTask = useMemo(
    () => (focus ? tasks.find((t) => t.id === focus.taskId) ?? null : null),
    [focus, tasks]
  )

  const value: Store = {
    hydrated,
    settings,
    tasks,
    history,
    inbox,
    today,
    later,
    ...derived,
    focus,
    focusRemaining,
    focusTask,
    lastRecap,
    addToInbox,
    removeTask,
    triageAssign,
    cycleCat,
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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Store {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
