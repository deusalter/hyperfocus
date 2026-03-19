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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 sm:gap-3"
    >
      {!isRunning && !isPaused && (
        <Button size="lg" onClick={onStart} className="min-w-[120px] sm:min-w-[140px]">
          <Play className="w-5 h-5" />
          Start Focus
        </Button>
      )}

      {isRunning && (
        <Button size="lg" variant="secondary" onClick={onPause} className="min-w-[120px] sm:min-w-[140px]">
          <Pause className="w-5 h-5" />
          Pause
        </Button>
      )}

      {isPaused && (
        <>
          <Button size="lg" onClick={onResume} className="min-w-[100px] sm:min-w-[120px]">
            <Play className="w-5 h-5" />
            Resume
          </Button>
          <Button size="lg" variant="secondary" onClick={onReset} aria-label="Reset timer">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </>
      )}

      {(isRunning || isPaused) && elapsed > 0 && (
        <Button size="lg" variant="ghost" onClick={onStop} aria-label="Stop and save session">
          <Square className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  )
}
