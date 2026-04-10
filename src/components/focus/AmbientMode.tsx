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
  const exitButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    exitButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        exitButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onExit])

  const accent = isBreak ? 'var(--color-success)' : 'var(--color-accent)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#000000' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Ambient focus mode — ${formatDuration(remaining)} remaining`}
    >
      <div className="relative z-10 text-center px-6" role="timer" aria-live="off" aria-atomic="true">
        <span className="sr-only" aria-live="polite">
          {formatDuration(remaining)} remaining
        </span>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="display-xl tabular-nums text-[120px] sm:text-[180px] md:text-[220px] leading-none"
            aria-hidden="true"
            style={{ color: '#f4f4f5' }}
          >
            {formatDuration(remaining)}
          </span>
        </motion.div>

        <div className="mt-10 mx-auto" style={{ width: 'min(320px, 80vw)' }}>
          <div className="h-[1px] w-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <motion.div
              className="h-full"
              style={{ background: accent }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {isBreak ? 'Break' : 'Focus'} · press Esc to exit
          </p>
        </div>
      </div>

      <motion.button
        ref={exitButtonRef}
        onClick={onExit}
        className="absolute top-5 right-5 p-2 rounded-lg transition-colors"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        whileHover={{ color: 'rgba(255,255,255,1)' }}
        aria-label="Exit ambient mode (Escape)"
      >
        <Minimize2 className="w-5 h-5" />
      </motion.button>
    </motion.div>
  )
}
