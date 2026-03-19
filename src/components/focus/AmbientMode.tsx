'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Minimize2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface AmbientModeProps {
  remaining: number
  progress: number
  isBreak: boolean
  onExit: () => void
}

export default function AmbientMode({ remaining, progress, isBreak, onExit }: AmbientModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exitButtonRef = useRef<HTMLButtonElement>(null)

  // Focus the exit button on mount and handle Escape key
  useEffect(() => {
    exitButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
      // Trap focus within ambient mode (only one focusable element)
      if (e.key === 'Tab') {
        e.preventDefault()
        exitButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onExit])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Ambient focus mode — ${formatDuration(remaining)} remaining`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-20 blur-[60px] sm:blur-[100px]"
          style={{
            background: isBreak
              ? 'radial-gradient(circle, var(--color-success), transparent)'
              : 'radial-gradient(circle, var(--color-accent), transparent)',
          }}
          animate={{
            x: ['-30%', '30%', '-30%'],
            y: ['-20%', '20%', '-20%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] rounded-full opacity-10 blur-[40px] sm:blur-[80px]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent-light), transparent)',
          }}
          animate={{
            x: ['20%', '-20%', '20%'],
            y: ['20%', '-30%', '20%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative z-10 text-center" role="timer" aria-live="off" aria-atomic="true">
        <span className="sr-only" aria-live="polite">
          {formatDuration(remaining)} remaining
        </span>
        <motion.span
          key={remaining}
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          className="text-6xl sm:text-7xl md:text-9xl font-bold tabular-nums tracking-tighter"
          aria-hidden="true"
        >
          {formatDuration(remaining)}
        </motion.span>

        <div className="mt-6 sm:mt-8 w-48 sm:w-64 mx-auto">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: isBreak ? 'var(--color-success)' : 'var(--color-accent)',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <motion.button
        ref={exitButtonRef}
        onClick={onExit}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted hover:text-foreground p-2 z-10 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Exit ambient mode (Escape)"
      >
        <Minimize2 className="w-5 h-5" />
      </motion.button>
    </motion.div>
  )
}
