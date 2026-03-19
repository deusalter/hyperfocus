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
      className="text-center py-8 relative"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          background: isBreak
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))'
            : 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.1))',
          boxShadow: isBreak
            ? '0 0 30px rgba(34, 197, 94, 0.15)'
            : '0 0 30px rgba(139, 92, 246, 0.2)',
        }}
      >
        {isBreak ? (
          <Coffee className="w-10 h-10 text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
        ) : (
          <PartyPopper className="w-10 h-10 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
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
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '40%',
                scale: 0,
              }}
              animate={{
                x: `${15 + Math.random() * 70}%`,
                y: `${5 + Math.random() * 90}%`,
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
                rotate: [0, Math.random() * 360],
              }}
              transition={{
                duration: 2,
                delay: 0.1 + i * 0.06,
                ease: 'easeOut',
              }}
              className="absolute rounded-full"
              style={{
                width: `${4 + Math.random() * 4}px`,
                height: `${4 + Math.random() * 4}px`,
                backgroundColor: ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#22d3ee', '#a78bfa'][i % 6],
                boxShadow: `0 0 6px ${['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#22d3ee', '#a78bfa'][i % 6]}66`,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
