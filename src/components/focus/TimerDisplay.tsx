'use client'

import { motion } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import { useId } from 'react'

interface TimerDisplayProps {
  remaining: number
  progress: number
  isRunning: boolean
  isBreak: boolean
}

export default function TimerDisplay({ remaining, progress, isRunning, isBreak }: TimerDisplayProps) {
  const size = 280
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const gradientId = useId()
  const glowId = useId()

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isBreak ? (
                <>
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </>
              )}
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth - 2}
            opacity={0.5}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            filter={progress > 0 ? `url(#${glowId})` : undefined}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={remaining}
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            className="text-5xl md:text-6xl font-bold tabular-nums tracking-tight"
            style={{
              textShadow: isRunning
                ? isBreak
                  ? '0 0 30px rgba(34, 197, 94, 0.15)'
                  : '0 0 30px rgba(139, 92, 246, 0.15)'
                : 'none',
            }}
          >
            {formatDuration(remaining)}
          </motion.span>
          <span className="text-sm text-muted mt-1">
            {isBreak ? 'Break Time' : isRunning ? 'Focusing...' : 'Ready'}
          </span>

          {isRunning && (
            <motion.div
              className="w-2 h-2 rounded-full mt-3"
              style={{
                backgroundColor: isBreak ? 'var(--color-success)' : 'var(--color-accent)',
                boxShadow: isBreak
                  ? '0 0 8px rgba(34, 197, 94, 0.6)'
                  : '0 0 8px rgba(139, 92, 246, 0.6)',
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
