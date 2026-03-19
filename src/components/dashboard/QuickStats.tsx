'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Timer, Flame } from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { formatMinutes } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function QuickStats() {
  const { todayCompletedTasks, todayFocusMinutes, streaks } = useStats()

  const stats = [
    {
      label: 'Tasks Done',
      value: todayCompletedTasks,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      glowColor: 'var(--color-success-glow)',
      gradientFrom: 'rgba(34, 197, 94, 0.08)',
    },
    {
      label: 'Focus Time',
      value: formatMinutes(todayFocusMinutes),
      icon: Timer,
      color: 'text-accent',
      bg: 'bg-accent/10',
      glowColor: 'var(--color-accent-glow)',
      gradientFrom: 'rgba(139, 92, 246, 0.08)',
    },
    {
      label: 'Day Streak',
      value: streaks.current,
      icon: Flame,
      color: 'text-warning',
      bg: 'bg-warning/10',
      glowColor: 'var(--color-warning-glow)',
      gradientFrom: 'rgba(245, 158, 11, 0.08)',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-3 mb-6"
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            variants={item}
            className="glass noise-texture p-4 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${stat.gradientFrom}, transparent 70%)`,
              }}
            />
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2 relative z-10`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold relative z-10 tabular-nums">{stat.value}</span>
            <span className="text-xs text-muted mt-0.5 relative z-10">{stat.label}</span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
