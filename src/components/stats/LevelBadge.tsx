'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
          <Star className="w-7 h-7 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">Level {level}</span>
            <span className="text-sm text-accent font-medium">{title}</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>{formatMinutes(totalMinutes)} total focus</span>
              {progress < 100 && <span>{formatMinutes(nextLevelMinutes)} for next level</span>}
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-accent rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
