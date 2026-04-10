'use client'

import { motion } from 'framer-motion'
import { Coffee, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'

interface SessionCompleteProps {
  isBreak: boolean
  onStartBreak: () => void
  onReset: () => void
  onNewSession: () => void
}

export default function SessionComplete({ isBreak, onStartBreak, onNewSession }: SessionCompleteProps) {
  const accent = isBreak ? 'var(--color-success)' : 'var(--color-accent)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-12 relative"
      role="status"
      aria-label={isBreak ? 'Break over. Ready to focus again?' : 'Session complete. Great work.'}
    >
      {/* Single expanding ring replaces the celebration confetti */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[56px] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pulse-out"
        style={{ border: `1px solid ${accent}`, transformOrigin: 'center' }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[56px] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{ background: accent }}
      />

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="display-xl text-[44px] sm:text-[56px] mt-20 leading-none"
      >
        {isBreak ? 'Break over.' : 'Session done.'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-sm text-muted mt-3"
      >
        {isBreak ? 'Ready for another round?' : 'Take a breath. Step away. Come back.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-8"
      >
        {!isBreak && (
          <Button onClick={onStartBreak} variant="secondary">
            <Coffee className="w-4 h-4" />
            5m break
          </Button>
        )}
        <Button onClick={onNewSession}>
          <RotateCcw className="w-4 h-4" />
          {isBreak ? 'Start focus' : 'Another session'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
