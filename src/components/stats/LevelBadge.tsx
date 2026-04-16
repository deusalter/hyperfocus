'use client'

import { motion } from 'framer-motion'
import { formatMinutes } from '@/lib/utils'
import Odometer from '@/components/ui/Odometer'

interface LevelBadgeProps {
  level: number
  title: string
  progress: number
  totalMinutes: number
  nextLevelMinutes: number
}

export default function LevelBadge({ level, title, progress, totalMinutes, nextLevelMinutes }: LevelBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6"
    >
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">Level</span>
          <Odometer value={level} className="display-xl text-[44px] sm:text-[56px]" />
          <span className="display-xl text-[20px] sm:text-[24px]" style={{ color: 'var(--color-accent)' }}>
            {title}
          </span>
        </div>
      </div>

      <div className="relative h-[2px] w-full bg-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0"
          style={{ background: 'var(--color-accent)' }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-muted mt-2 tabular-nums">
        <span>{formatMinutes(totalMinutes)} total</span>
        {progress < 100 && <span>→ {formatMinutes(nextLevelMinutes)}</span>}
      </div>
    </motion.div>
  )
}
