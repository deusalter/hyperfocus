'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/useStats'
import DailyChart from '@/components/stats/DailyChart'
import StreakDisplay from '@/components/stats/StreakDisplay'
import LevelBadge from '@/components/stats/LevelBadge'
import WeeklySummary from '@/components/stats/WeeklySummary'

export default function StatsPage() {
  const { last7DaysFocus, last7DaysTasks, streaks, level, totalFocusMinutes, weeklySummary } = useStats()

  const focusChartData = last7DaysFocus.map((d) => ({
    date: d.date,
    value: d.minutes,
    dayLabel: d.dayLabel,
  }))

  const tasksChartData = last7DaysTasks.map((d) => ({
    date: d.date,
    value: d.count,
    dayLabel: d.dayLabel,
  }))

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6"
      >
        Stats
      </motion.h1>

      <div className="space-y-4">
        <LevelBadge
          level={level.level}
          title={level.title}
          progress={level.progress}
          totalMinutes={totalFocusMinutes}
          nextLevelMinutes={level.nextLevelMinutes}
        />

        <WeeklySummary
          totalTasks={weeklySummary.totalTasks}
          totalMinutes={weeklySummary.totalMinutes}
          activeDays={weeklySummary.activeDays}
        />

        <StreakDisplay current={streaks.current} longest={streaks.longest} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DailyChart
            data={focusChartData}
            label="Focus Time (7 days)"
            color="var(--color-accent)"
            unit="m"
          />
          <DailyChart
            data={tasksChartData}
            label="Tasks Completed (7 days)"
            color="var(--color-success)"
            unit=""
          />
        </div>
      </div>
    </div>
  )
}
