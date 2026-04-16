'use client'

import { motion } from 'framer-motion'
import { formatMinutes } from '@/lib/utils'
import Odometer from '@/components/ui/Odometer'

interface WeeklySummaryProps {
  totalTasks: number
  totalMinutes: number
  activeDays: number
}

export default function WeeklySummary({ totalTasks, totalMinutes, activeDays }: WeeklySummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6"
    >
      <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-4">This week</h3>
      <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-5">
        <div className="px-3 sm:px-5 text-center">
          <Odometer value={totalTasks} className="display-xl text-[30px] sm:text-[36px]" />
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">Tasks</div>
        </div>
        <div className="px-3 sm:px-5 text-center">
          <span className="display-xl text-[30px] sm:text-[36px] tabular-nums">{formatMinutes(totalMinutes)}</span>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">Focus</div>
        </div>
        <div className="px-3 sm:px-5 text-center">
          <span className="display-xl text-[30px] sm:text-[36px] tabular-nums">{activeDays}<span className="text-muted">/7</span></span>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">Days</div>
        </div>
      </div>
    </motion.div>
  )
}
