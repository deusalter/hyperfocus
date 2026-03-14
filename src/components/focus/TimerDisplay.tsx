'use client'

import { motion } from 'framer-motion'
import { formatDuration } from '@/lib/utils'

interface TimerDisplayProps {
  remaining: number
  progress: number
  isRunning: boolean
  isBreak: boolean
}

export default function TimerDisplay({ remaining, progress, isRunning, isBreak }: TimerDisplayProps) {
  const size = 280
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isBreak ? 'var(--color-success)' : 'var(--color-accent)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={remaining}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="text-5xl md:text-6xl font-bold tabular-nums tracking-tight"
          >
            {formatDuration(remaining)}
          </motion.span>
          <span className="text-sm text-muted mt-1">
            {isBreak ? 'Break Time' : isRunning ? 'Focusing...' : 'Ready'}
          </span>

          {isRunning && (
            <motion.div
              className="w-2 h-2 rounded-full bg-accent mt-3"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
