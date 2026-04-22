import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { Task, TaskCategory, EnergyLevel } from '@/lib/types'
import { generateId, getDayKey } from '@/lib/utils'

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('hyperfocus-tasks', [])

  const addTask = useCallback((title: string, category: TaskCategory = 'today', energyLevel?: EnergyLevel) => {
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      category,
      completed: false,
      createdAt: new Date().toISOString(),
      energyLevel,
      order: Date.now(),
    }
    setTasks((prev) => [task, ...prev])
    return task
  }, [setTasks])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      )
    )
  }, [setTasks])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [setTasks])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [setTasks])

  const moveTask = useCallback((id: string, category: TaskCategory) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t))
    )
  }, [setTasks])

  const restoreTask = useCallback((task: Task) => {
    setTasks((prev) => {
      if (prev.some((t) => t.id === task.id)) return prev
      return [task, ...prev]
    })
  }, [setTasks])

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    setTasks(reorderedTasks)
  }, [setTasks])

  const addBrainDumpTasks = useCallback((text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const newTasks: Task[] = lines.map((title, i) => ({
      id: generateId(),
      title,
      category: 'today' as TaskCategory,
      completed: false,
      createdAt: new Date().toISOString(),
      order: Date.now() + i,
    }))

    setTasks((prev) => [...newTasks, ...prev])
    return newTasks.length
  }, [setTasks])

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.category === 'today').sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.order - a.order
    }),
    [tasks]
  )

  const completedToday = useMemo(() => {
    const today = getDayKey()
    return tasks.filter(
      (t) => t.completed && t.completedAt && t.completedAt.startsWith(today)
    )
  }, [tasks])

  const tasksByCategory = useCallback(
    (category: TaskCategory) =>
      tasks
        .filter((t) => t.category === category)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1
          return b.order - a.order
        }),
    [tasks]
  )

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    moveTask,
    reorderTasks,
    addBrainDumpTasks,
    restoreTask,
    todayTasks,
    completedToday,
    tasksByCategory,
  }
}
