'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import { useId } from 'react'

interface TimerDisplayProps {
  remaining: number
  progress: number
  isRunning: boolean
  isBreak: boolean
}

export default function TimerDisplay({ remaining, progress, isRunning, isBreak }: TimerDisplayProps) {
  const viewBoxSize = 280
  const strokeWidth = 8
  const radius = (viewBoxSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const gradientId = useId()
  const glowId = useId()
  const outerGlowId = useId()

  const accentColor = isBreak ? 'rgba(34, 197, 94,' : 'rgba(139, 92, 246,'

  return (
    <div className="flex items-center justify-center py-6 sm:py-8">
      <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]">
        {/* Breathing outer glow ring — only when running */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-[-20px] sm:inset-[-20px] flex items-center justify-center"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${accentColor} 0.12)`,
                  boxShadow: `0 0 40px ${accentColor} 0.08), inset 0 0 40px ${accentColor} 0.04)`,
                }}
                animate={{
                  scale: [1, 1.03, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute inset-[-12px] rounded-full"
                style={{
                  border: `1px solid ${accentColor} 0.06)`,
                }}
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="-rotate-90 w-full h-full">
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
            <filter id={outerGlowId}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Decorative tick marks around the ring */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180
            const isMajor = i % 5 === 0
            const innerR = radius - (isMajor ? 14 : 10)
            const outerR = radius - 6
            return (
              <line
                key={i}
                x1={viewBoxSize / 2 + innerR * Math.cos(angle)}
                y1={viewBoxSize / 2 + innerR * Math.sin(angle)}
                x2={viewBoxSize / 2 + outerR * Math.cos(angle)}
                y2={viewBoxSize / 2 + outerR * Math.sin(angle)}
                stroke="var(--color-border)"
                strokeWidth={isMajor ? 1.5 : 0.5}
                opacity={isMajor ? 0.4 : 0.15}
                strokeLinecap="round"
              />
            )
          })}

          {/* Background track */}
          <circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth - 2}
            opacity={0.5}
          />

          {/* Progress arc */}
          <motion.circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
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

          {/* Leading dot at the end of the progress arc */}
          {progress > 0 && progress < 100 && (
            <motion.circle
              cx={viewBoxSize / 2 + radius * Math.cos(((progress / 100) * 360 - 90) * (Math.PI / 180))}
              cy={viewBoxSize / 2 + radius * Math.sin(((progress / 100) * 360 - 90) * (Math.PI / 180))}
              r={strokeWidth / 2 + 2}
              fill={isBreak ? '#22c55e' : '#8b5cf6'}
              opacity={0.9}
              filter={`url(#${outerGlowId})`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={remaining}
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums tracking-tight"
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
