'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TimerPresetsProps {
  currentDuration: number
  onSelect: (seconds: number) => void
  disabled: boolean
}

const presets = [
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
]

export default function TimerPresets({ currentDuration, onSelect, disabled }: TimerPresetsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {presets.map((preset) => (
        <motion.button
          key={preset.label}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => !disabled && onSelect(preset.seconds)}
          disabled={disabled}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-xl transition-colors',
            currentDuration === preset.seconds
              ? 'text-white'
              : 'text-muted hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {currentDuration === preset.seconds && (
            <motion.div
              layoutId="presetTab"
              className="absolute inset-0 bg-accent/20 border border-accent/30 rounded-xl"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{preset.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
