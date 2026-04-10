'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TimerPresetsProps {
  currentDuration: number
  onSelect: (seconds: number) => void
  disabled: boolean
}

const presets = [
  { label: '15', seconds: 15 * 60 },
  { label: '25', seconds: 25 * 60 },
  { label: '45', seconds: 45 * 60 },
  { label: '60', seconds: 60 * 60 },
]

export default function TimerPresets({ currentDuration, onSelect, disabled }: TimerPresetsProps) {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-8 mb-4 relative">
      {presets.map((preset) => {
        const isActive = currentDuration === preset.seconds
        return (
          <button
            key={preset.label}
            onClick={() => !disabled && onSelect(preset.seconds)}
            disabled={disabled}
            className={cn(
              'relative py-2 text-sm font-mono transition-colors duration-150',
              isActive ? 'text-foreground' : 'text-muted hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-pressed={isActive}
            aria-label={`${preset.label} minutes`}
          >
            <span className="tabular-nums">{preset.label}<span className="text-muted">m</span></span>
            {isActive && (
              <motion.div
                layoutId="presetTab"
                className="absolute left-0 right-0 -bottom-0.5 h-[2px]"
                style={{ background: 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
