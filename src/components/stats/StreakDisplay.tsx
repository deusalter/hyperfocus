'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy } from 'lucide-react'

interface StreakDisplayProps {
  current: number
  longest: number
}

export default function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="glass p-5 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(245, 158, 11, 0.1), transparent 70%)',
          }}
        />
        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3 relative z-10">
          <Flame className="w-6 h-6 text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
        </div>
        <motion.span
          className="text-3xl font-bold block tabular-nums relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {current}
        </motion.span>
        <span className="text-xs text-muted relative z-10">Current Streak</span>
        {current > 0 && (
          <span className="text-[10px] text-warning/60 block mt-1 relative z-10">
            {current === 1 ? '1 day' : `${current} days`}
          </span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="glass p-5 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(139, 92, 246, 0.1), transparent 70%)',
          }}
        />
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3 relative z-10">
          <Trophy className="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
        </div>
        <motion.span
          className="text-3xl font-bold block tabular-nums relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {longest}
        </motion.span>
        <span className="text-xs text-muted relative z-10">Longest Streak</span>
        {longest > 0 && (
          <span className="text-[10px] text-accent/60 block mt-1 relative z-10">
            Personal best
          </span>
        )}
      </motion.div>
    </div>
  )
}
