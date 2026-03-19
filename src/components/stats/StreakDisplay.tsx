'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy } from 'lucide-react'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

interface StreakDisplayProps {
  current: number
  longest: number
}

export default function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="glass noise-texture p-4 sm:p-5 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(245, 158, 11, 0.1), transparent 70%)',
          }}
        />
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 relative z-10">
          <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
        </div>
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatedNumber value={current} className="text-2xl sm:text-3xl font-bold block tabular-nums" />
        </motion.div>
        <span className="text-xs text-muted relative z-10">Current Streak</span>
        {current > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-warning/60 block mt-1.5 relative z-10 flex items-center justify-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-warning/40" />
            {current === 1 ? '1 day' : `${current} days`}
          </motion.span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="glass noise-texture p-4 sm:p-5 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(139, 92, 246, 0.1), transparent 70%)',
          }}
        />
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 relative z-10">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
        </div>
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatedNumber value={longest} className="text-2xl sm:text-3xl font-bold block tabular-nums" />
        </motion.div>
        <span className="text-xs text-muted relative z-10">Longest Streak</span>
        {longest > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] text-accent/60 block mt-1.5 relative z-10 flex items-center justify-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-accent/40" />
            Personal best
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}
