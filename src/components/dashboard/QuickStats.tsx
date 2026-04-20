'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/useStats'
import { formatMinutes } from '@/lib/utils'
import Odometer from '@/components/ui/Odometer'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] as [number, number, number, number], duration: 0.4 } },
}

export default function QuickStats() {
  const { todayCompletedTasks, todayFocusMinutes, streaks } = useStats()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 divide-x divide-border border-y border-border py-6 mb-8"
    >
      <motion.div variants={item} className="px-4 sm:px-6 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">Done today</div>
        <Odometer value={todayCompletedTasks} className="display-xl text-[36px] sm:text-[44px]" />
      </motion.div>

      <motion.div variants={item} className="px-4 sm:px-6 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">Focus</div>
        <span className="display-xl text-[36px] sm:text-[44px] tabular-nums">
          {formatMinutes(todayFocusMinutes)}
        </span>
      </motion.div>

      <motion.div variants={item} className="px-4 sm:px-6 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">Streak</div>
        <div className="flex items-baseline justify-center gap-1.5">
          <Odometer value={streaks.current} className="display-xl text-[36px] sm:text-[44px]" />
          <span
            className="text-xs tracking-wide"
            style={{ color: streaks.current > 0 ? 'var(--color-accent)' : 'var(--color-muted)' }}
          >
            {streaks.current === 1 ? 'day' : 'days'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
