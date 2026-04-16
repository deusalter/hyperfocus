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
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="display-xl text-[44px] sm:text-[56px]">Stats<span style={{ color: 'var(--color-accent)' }}>.</span></h1>
        <p className="text-sm text-muted mt-1">Signal, not guilt.</p>
      </motion.div>

      <LevelBadge
        level={level.level}
        title={level.title}
        progress={level.progress}
        totalMinutes={totalFocusMinutes}
        nextLevelMinutes={level.nextLevelMinutes}
      />

      <StreakDisplay current={streaks.current} longest={streaks.longest} />

      <WeeklySummary
        totalTasks={weeklySummary.totalTasks}
        totalMinutes={weeklySummary.totalMinutes}
        activeDays={weeklySummary.activeDays}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 border-t border-border">
        <DailyChart
          data={focusChartData}
          label="Focus · 7 days"
          color="var(--color-accent)"
          unit="m"
        />
        <DailyChart
          data={tasksChartData}
          label="Tasks · 7 days"
          color="var(--color-foreground)"
          unit=""
        />
      </div>
    </div>
  )
}
