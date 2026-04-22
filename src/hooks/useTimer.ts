import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { FocusSession } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface TimerState {
  isRunning: boolean
  isPaused: boolean
  duration: number
  remaining: number
  elapsed: number
  taskId?: string
  taskTitle?: string
}

export function useTimer() {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>('hyperfocus-sessions', [])
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    duration: 25 * 60,
    remaining: 25 * 60,
    elapsed: 0,
  })
  const [isComplete, setIsComplete] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.remaining <= 1) {
        return { ...prev, remaining: 0, elapsed: prev.duration, isRunning: false, isPaused: false }
      }
      return {
        ...prev,
        remaining: prev.remaining - 1,
        elapsed: prev.elapsed + 1,
      }
    })
  }, [])

  useEffect(() => {
    if (state.remaining === 0 && state.elapsed > 0 && !isComplete) {
      clearTimer()
      setIsComplete(true)

      const session: FocusSession = {
        id: generateId(),
        taskId: state.taskId,
        taskTitle: state.taskTitle,
        duration: state.duration,
        actualDuration: state.elapsed,
        completedAt: new Date().toISOString(),
        completed: true,
      }
      setSessions((prev) => [session, ...prev])
    }
  }, [state.remaining, state.elapsed, state.duration, state.taskId, state.taskTitle, isComplete, clearTimer, setSessions])

  const start = useCallback((duration: number, taskId?: string, taskTitle?: string) => {
    clearTimer()
    setIsComplete(false)
    setIsBreak(false)
    setState({
      isRunning: true,
      isPaused: false,
      duration,
      remaining: duration,
      elapsed: 0,
      taskId,
      taskTitle,
    })
    intervalRef.current = setInterval(tick, 1000)
  }, [clearTimer, tick])

  const pause = useCallback(() => {
    clearTimer()
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }))
  }, [clearTimer])

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }))
    intervalRef.current = setInterval(tick, 1000)
  }, [tick])

  const reset = useCallback(() => {
    clearTimer()
    setIsComplete(false)
    setIsBreak(false)
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      remaining: prev.duration,
      elapsed: 0,
    }))
  }, [clearTimer])

  const stop = useCallback(() => {
    clearTimer()
    if (state.elapsed > 60) {
      const session: FocusSession = {
        id: generateId(),
        taskId: state.taskId,
        taskTitle: state.taskTitle,
        duration: state.duration,
        actualDuration: state.elapsed,
        completedAt: new Date().toISOString(),
        completed: false,
      }
      setSessions((prev) => [session, ...prev])
    }
    setIsComplete(false)
    setIsBreak(false)
    setState({
      isRunning: false,
      isPaused: false,
      duration: state.duration,
      remaining: state.duration,
      elapsed: 0,
    })
  }, [clearTimer, state.elapsed, state.duration, state.taskId, state.taskTitle, setSessions])

  const startBreak = useCallback(() => {
    setIsComplete(false)
    setIsBreak(true)
    start(5 * 60)
  }, [start])

  const setDuration = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      duration: seconds,
      remaining: seconds,
    }))
  }, [])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const progress = state.duration > 0 ? ((state.duration - state.remaining) / state.duration) * 100 : 0

  return {
    ...state,
    isComplete,
    isBreak,
    progress,
    sessions,
    start,
    pause,
    resume,
    reset,
    stop,
    startBreak,
    setDuration,
  }
}
