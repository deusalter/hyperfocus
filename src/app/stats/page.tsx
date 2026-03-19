'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/useStats'
import DailyChart from '@/components/stats/DailyChart'
import StreakDisplay from '@/components/stats/StreakDisplay'
import LevelBadge from '@/components/stats/LevelBadge'
import WeeklySummary from '@/components/stats/WeeklySummary'
import ScrollReveal from '@/components/ui/ScrollReveal'

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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-sm text-muted mt-0.5">Track your progress and growth</p>
      </motion.div>

      <div className="space-y-4">
        <ScrollReveal delay={0}>
          <LevelBadge
            level={level.level}
            title={level.title}
            progress={level.progress}
            totalMinutes={totalFocusMinutes}
            nextLevelMinutes={level.nextLevelMinutes}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <WeeklySummary
            totalTasks={weeklySummary.totalTasks}
            totalMinutes={weeklySummary.totalMinutes}
            activeDays={weeklySummary.activeDays}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <StreakDisplay current={streaks.current} longest={streaks.longest} />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScrollReveal delay={0.3}>
            <DailyChart
              data={focusChartData}
              label="Focus Time (7 days)"
              color="var(--color-accent)"
              unit="m"
            />
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <DailyChart
              data={tasksChartData}
              label="Tasks Completed (7 days)"
              color="var(--color-success)"
              unit=""
            />
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
