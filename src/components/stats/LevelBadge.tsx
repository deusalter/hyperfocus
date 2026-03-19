'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

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
      className="glass-highlight noise-texture p-4 sm:p-5 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 0% 50%, rgba(139, 92, 246, 0.15), transparent 60%)',
        }}
      />
      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-accent/20"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.15))',
          }}
        >
          <Star className="w-6 h-6 sm:w-7 sm:h-7 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold">Level <AnimatedNumber value={level} className="tabular-nums" /></span>
            <span className="text-xs sm:text-sm text-accent font-medium">{title}</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted mb-1 gap-2">
              <span className="truncate">{formatMinutes(totalMinutes)} total focus</span>
              {progress < 100 && <span className="truncate text-right">{formatMinutes(nextLevelMinutes)} next</span>}
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--color-accent-dark), var(--color-accent-light))',
                  boxShadow: '0 0 8px rgba(139, 92, 246, 0.4)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
