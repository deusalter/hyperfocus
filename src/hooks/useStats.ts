'use client'

import { useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { FocusSession, Task } from '@/lib/types'
import { getDayKey, getLevelFromMinutes } from '@/lib/utils'
import { subDays, differenceInCalendarDays, parseISO } from 'date-fns'

export function useStats() {
  const [sessions] = useLocalStorage<FocusSession[]>('hyperfocus-sessions', [])
  const [tasks] = useLocalStorage<Task[]>('hyperfocus-tasks', [])

  const totalFocusMinutes = useMemo(
    () => Math.round(sessions.reduce((acc, s) => acc + s.actualDuration, 0) / 60),
    [sessions]
  )

  const todayFocusMinutes = useMemo(() => {
    const today = getDayKey()
    return Math.round(
      sessions
        .filter((s) => s.completedAt.startsWith(today))
        .reduce((acc, s) => acc + s.actualDuration, 0) / 60
    )
  }, [sessions])

  const todayCompletedTasks = useMemo(() => {
    const today = getDayKey()
    return tasks.filter(
      (t) => t.completed && t.completedAt && t.completedAt.startsWith(today)
    ).length
  }, [tasks])

  const last7DaysFocus = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const key = getDayKey(date)
      const minutes = Math.round(
        sessions
          .filter((s) => s.completedAt.startsWith(key))
          .reduce((acc, s) => acc + s.actualDuration, 0) / 60
      )
      days.push({ date: key, minutes, dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [sessions])

  const last7DaysTasks = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const key = getDayKey(date)
      const count = tasks.filter(
        (t) => t.completed && t.completedAt && t.completedAt.startsWith(key)
      ).length
      days.push({ date: key, count, dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [tasks])

  const streaks = useMemo(() => {
    const activeDays = new Set<string>()

    sessions.forEach((s) => {
      if (s.completed) activeDays.add(s.completedAt.split('T')[0])
    })
    tasks.forEach((t) => {
      if (t.completed && t.completedAt) activeDays.add(t.completedAt.split('T')[0])
    })

    const sortedDays = Array.from(activeDays).sort().reverse()
    if (sortedDays.length === 0) return { current: 0, longest: 0 }

    let currentStreak = 0
    const today = getDayKey()
    const yesterday = getDayKey(subDays(new Date(), 1))

    if (sortedDays[0] === today || sortedDays[0] === yesterday) {
      currentStreak = 1
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = parseISO(sortedDays[i - 1])
        const curr = parseISO(sortedDays[i])
        if (differenceInCalendarDays(prev, curr) === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    let longestStreak = 1
    let tempStreak = 1
    const allDaysSorted = Array.from(activeDays).sort()
    for (let i = 1; i < allDaysSorted.length; i++) {
      const prev = parseISO(allDaysSorted[i - 1])
      const curr = parseISO(allDaysSorted[i])
      if (differenceInCalendarDays(curr, prev) === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }
    if (allDaysSorted.length === 0) longestStreak = 0

    return { current: currentStreak, longest: longestStreak }
  }, [sessions, tasks])

  const level = useMemo(() => getLevelFromMinutes(totalFocusMinutes), [totalFocusMinutes])

  const weeklySummary = useMemo(() => {
    const totalTasks = last7DaysTasks.reduce((acc, d) => acc + d.count, 0)
    const totalMinutes = last7DaysFocus.reduce((acc, d) => acc + d.minutes, 0)
    const activeDays = last7DaysFocus.filter((d) => d.minutes > 0 || last7DaysTasks.find((t) => t.date === d.date && t.count > 0)).length

    return { totalTasks, totalMinutes, activeDays }
  }, [last7DaysFocus, last7DaysTasks])

  return {
    totalFocusMinutes,
    todayFocusMinutes,
    todayCompletedTasks,
    last7DaysFocus,
    last7DaysTasks,
    streaks,
    level,
    weeklySummary,
  }
}
