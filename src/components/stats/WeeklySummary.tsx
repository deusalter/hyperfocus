'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Timer, Calendar } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

interface WeeklySummaryProps {
  totalTasks: number
  totalMinutes: number
  activeDays: number
}

export default function WeeklySummary({ totalTasks, totalMinutes, activeDays }: WeeklySummaryProps) {
  const stats = [
    {
      label: 'Tasks Completed',
      numericValue: totalTasks,
      displayValue: null as string | null,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      glowColor: 'rgba(34, 197, 94, 0.4)',
    },
    {
      label: 'Focus Time',
      numericValue: null as number | null,
      displayValue: formatMinutes(totalMinutes),
      icon: Timer,
      color: 'text-accent',
      bg: 'bg-accent/10',
      glowColor: 'rgba(139, 92, 246, 0.4)',
    },
    {
      label: 'Active Days',
      numericValue: null as number | null,
      displayValue: `${activeDays}/7`,
      icon: Calendar,
      color: 'text-warning',
      bg: 'bg-warning/10',
      glowColor: 'rgba(245, 158, 11, 0.4)',
    },
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
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${stat.color}`} style={{ filter: `drop-shadow(0 0 6px ${stat.glowColor})` }} />
              </div>
              {stat.numericValue !== null ? (
                <AnimatedNumber value={stat.numericValue} className="text-lg font-bold block tabular-nums" />
              ) : (
                <span className="text-lg font-bold block tabular-nums">{stat.displayValue}</span>
              )}
              <span className="text-[10px] text-muted">{stat.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
