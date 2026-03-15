'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Timer, Calendar } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'

interface WeeklySummaryProps {
  totalTasks: number
  totalMinutes: number
  activeDays: number
}

export default function WeeklySummary({ totalTasks, totalMinutes, activeDays }: WeeklySummaryProps) {
  const stats = [
    { label: 'Tasks Completed', value: totalTasks, icon: CheckCircle2, color: 'text-success' },
    { label: 'Focus Time', value: formatMinutes(totalMinutes), icon: Timer, color: 'text-accent' },
    { label: 'Active Days', value: `${activeDays}/7`, icon: Calendar, color: 'text-warning' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">This Week</h3>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="text-center">
              <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <span className="text-lg font-bold block">{stat.value}</span>
              <span className="text-[10px] text-muted">{stat.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
