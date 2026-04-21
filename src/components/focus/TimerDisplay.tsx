'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import { useId, useEffect, useState } from 'react'

interface TimerDisplayProps {
  remaining: number
  progress: number
  isRunning: boolean
  isBreak: boolean
  duration: number
}

export default function TimerDisplay({ remaining, progress, isRunning, isBreak, duration }: TimerDisplayProps) {
  const viewBoxSize = 280
  const strokeWidth = 2
  const radius = (viewBoxSize - strokeWidth) / 2 - 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const gradientId = useId()

  // One subtle pulse every 60s while running.
  const [pulseKey, setPulseKey] = useState(0)
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setPulseKey((k) => k + 1), 60000)
    return () => clearInterval(interval)
  }, [isRunning])

  const ringColor = isBreak ? 'var(--color-success)' : 'var(--color-accent)'

  return (
    <div className="flex items-center justify-center py-8 sm:py-10">
      <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]">
        {/* Minute-pulse ring */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              key={pulseKey}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `1px solid ${ringColor}` }}
              initial={{ scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1.18, opacity: 0 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="-rotate-90 w-full h-full" aria-hidden="true" role="img">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringColor} stopOpacity="1" />
              <stop offset="100%" stopColor={ringColor} stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180
            const isMajor = i % 5 === 0
            const innerR = radius - (isMajor ? 10 : 6)
            const outerR = radius - 2
            return (
              <line
                key={i}
                x1={viewBoxSize / 2 + innerR * Math.cos(angle)}
                y1={viewBoxSize / 2 + innerR * Math.sin(angle)}
                x2={viewBoxSize / 2 + outerR * Math.cos(angle)}
                y2={viewBoxSize / 2 + outerR * Math.sin(angle)}
                stroke="var(--color-border-hover)"
                strokeWidth={isMajor ? 1 : 0.5}
                opacity={isMajor ? 0.5 : 0.2}
                strokeLinecap="round"
              />
            )
          })}

          {/* Track */}
          <circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          <motion.circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth + 1}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Leading dot */}
          {progress > 0 && progress < 100 && (
            <motion.circle
              cx={viewBoxSize / 2 + radius * Math.cos(((progress / 100) * 360 - 90) * (Math.PI / 180))}
              cy={viewBoxSize / 2 + radius * Math.sin(((progress / 100) * 360 - 90) * (Math.PI / 180))}
              r={3}
              fill={ringColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          role="timer"
          aria-live="off"
          aria-atomic="true"
        >
          <span className="sr-only" aria-live="polite">
            {formatDuration(remaining)} remaining. {isBreak ? 'Break time' : isRunning ? 'Focusing' : 'Ready'}
          </span>
          {/* Keyed on `duration` so the slide-swap only fires on preset change,
              not on every per-second tick of `remaining`. No overflow clipping —
              mode="wait" ensures only one element exists at a time, so the blur
              halo can expand freely without revealing a cutoff box edge. */}
          <div className="relative h-[68px] sm:h-[86px] flex items-center justify-center" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={duration}
                initial={{ y: 14, opacity: 0, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -14, opacity: 0, filter: 'blur(6px)' }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="display-xl text-[60px] sm:text-[76px] tabular-nums leading-none absolute"
              >
                {formatDuration(remaining)}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted mt-2" aria-hidden="true">
            {isBreak ? 'Break' : isRunning ? 'Focusing' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  )
}
