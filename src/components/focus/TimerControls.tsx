'use client'

import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Square } from 'lucide-react'
import Button from '@/components/ui/Button'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  elapsed: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onStop: () => void
}

export default function TimerControls({
  isRunning,
  isPaused,
  elapsed,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
}: TimerControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 sm:gap-3"
    >
      {!isRunning && !isPaused && (
        <Button size="lg" onClick={onStart} className="min-w-[140px]">
          <Play className="w-5 h-5" />
          Start focus
        </Button>
      )}

      {isRunning && (
        <>
          <Button size="lg" variant="secondary" onClick={onPause} className="min-w-[120px]">
            <Pause className="w-5 h-5" />
            Pause
          </Button>
          {elapsed > 0 && (
            <Button size="lg" variant="ghost" onClick={onStop} aria-label="End session and save progress">
              <Square className="w-4 h-4" />
              End session
            </Button>
          )}
        </>
      )}

      {isPaused && (
        <>
          <Button size="lg" onClick={onResume} className="min-w-[120px]">
            <Play className="w-5 h-5" />
            Resume
          </Button>
          <Button size="lg" variant="secondary" onClick={onReset} aria-label="Reset timer to full duration">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          {elapsed > 0 && (
            <Button size="lg" variant="ghost" onClick={onStop} aria-label="End session and save progress">
              <Square className="w-4 h-4" />
              End
            </Button>
          )}
        </>
      )}
    </motion.div>
  )
}
