'use client'

import { motion } from 'framer-motion'
import Odometer from '@/components/ui/Odometer'

interface StreakDisplayProps {
  current: number
  longest: number
}

export default function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 divide-x divide-border border-y border-border py-6"
    >
      <div className="px-4 sm:px-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">Current streak</div>
        <div className="flex items-baseline gap-2">
          <Odometer value={current} className="display-xl text-[40px] sm:text-[52px]" />
          <span
            className="text-xs"
            style={{ color: current > 0 ? 'var(--color-accent)' : 'var(--color-muted)' }}
          >
            {current === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">Longest</div>
        <div className="flex items-baseline gap-2">
          <Odometer value={longest} className="display-xl text-[40px] sm:text-[52px] text-muted-strong" />
          <span className="text-xs text-muted">best</span>
        </div>
      </div>
    </motion.div>
  )
}
