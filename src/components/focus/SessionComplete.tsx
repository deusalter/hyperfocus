'use client'

import { motion } from 'framer-motion'
import { PartyPopper, Coffee, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'

interface SessionCompleteProps {
  isBreak: boolean
  onStartBreak: () => void
  onReset: () => void
  onNewSession: () => void
}

export default function SessionComplete({ isBreak, onStartBreak, onReset, onNewSession }: SessionCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
      >
        {isBreak ? (
          <Coffee className="w-10 h-10 text-success" />
        ) : (
          <PartyPopper className="w-10 h-10 text-accent" />
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2"
      >
        {isBreak ? 'Break Over!' : 'Session Complete!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted text-sm mb-6"
      >
        {isBreak
          ? 'Ready to focus again?'
          : 'Great work! You earned a break.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-3"
      >
        {!isBreak && (
          <Button onClick={onStartBreak} variant="secondary">
            <Coffee className="w-4 h-4" />
            5min Break
          </Button>
        )}
        <Button onClick={onNewSession}>
          <RotateCcw className="w-4 h-4" />
          {isBreak ? 'Start Focus' : 'Another Session'}
        </Button>
      </motion.div>

      {/* Celebration particles */}
      {!isBreak && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '40%',
                scale: 0,
              }}
              animate={{
                x: `${20 + Math.random() * 60}%`,
                y: `${10 + Math.random() * 80}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.1 + i * 0.08,
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#22d3ee'][i % 5],
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
