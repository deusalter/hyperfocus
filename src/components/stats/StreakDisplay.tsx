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
        className="glass p-5 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
          <Flame className="w-6 h-6 text-warning" />
        </div>
        <span className="text-3xl font-bold block">{current}</span>
        <span className="text-xs text-muted">Current Streak</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass p-5 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6 text-accent" />
        </div>
        <span className="text-3xl font-bold block">{longest}</span>
        <span className="text-xs text-muted">Longest Streak</span>
      </motion.div>
    </div>
  )
}
