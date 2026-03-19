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

const celebrationColors = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#22d3ee', '#a78bfa']

export default function SessionComplete({ isBreak, onStartBreak, onReset, onNewSession }: SessionCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 relative"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: isBreak
            ? 'radial-gradient(ellipse at 50% 30%, rgba(34, 197, 94, 0.12), transparent 60%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.15), transparent 60%)',
        }}
      />

      {/* Pulsing ring behind icon */}
      {!isBreak && (
        <motion.div
          className="absolute left-1/2 top-8 -translate-x-1/2 w-28 h-28 rounded-full"
          style={{
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
          animate={{
            scale: [1, 1.3, 1.5],
            opacity: [0.4, 0.1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10"
        style={{
          background: isBreak
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))'
            : 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.1))',
          boxShadow: isBreak
            ? '0 0 30px rgba(34, 197, 94, 0.15), 0 0 60px rgba(34, 197, 94, 0.05)'
            : '0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(139, 92, 246, 0.08)',
          border: isBreak
            ? '1px solid rgba(34, 197, 94, 0.15)'
            : '1px solid rgba(139, 92, 246, 0.15)',
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
        className="text-2xl font-bold mb-1 relative z-10"
      >
        {isBreak ? 'Break Over!' : 'Session Complete!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted text-sm mb-6 relative z-10"
      >
        {isBreak
          ? 'Ready to focus again?'
          : 'Great work! You earned a break.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-3 relative z-10"
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

      {/* Celebration particles — two rings for depth */}
      {!isBreak && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const color = celebrationColors[i % celebrationColors.length]
            const size = 3 + Math.random() * 5
            const isSquare = i % 3 === 0
            return (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '35%',
                  scale: 0,
                }}
                animate={{
                  x: `${10 + Math.random() * 80}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1.2, 0],
                  opacity: [0, 0.9, 0],
                  rotate: [0, Math.random() * 720],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  delay: 0.05 + i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  borderRadius: isSquare ? '2px' : '50%',
                  boxShadow: `0 0 8px ${color}88`,
                }}
              />
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
