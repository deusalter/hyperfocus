'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
}

const sparkleColors = ['#8b5cf6', '#22c55e', '#a78bfa', '#34d399', '#f59e0b']

function Sparkles({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const distance = 14 + Math.random() * 8
        const color = sparkleColors[i % sparkleColors.length]
        const size = 2 + Math.random() * 2.5

        return (
          <motion.div
            key={i}
            initial={{
              x: '50%',
              y: '50%',
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: `calc(50% + ${Math.cos(angle) * distance}px)`,
              y: `calc(50% + ${Math.sin(angle) * distance}px)`,
              scale: [0, 1.3, 0],
              opacity: [1, 0.8, 0],
            }}
            transition={{
              duration: 0.5,
              delay: i * 0.02,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: i % 2 === 0 ? '50%' : '1px',
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}
    </div>
  )
}

export default function AnimatedCheckbox({ checked, onChange, label }: AnimatedCheckboxProps) {
  const [showSparkles, setShowSparkles] = useState(false)

  const handleChange = useCallback(() => {
    if (!checked) {
      setShowSparkles(true)
      setTimeout(() => setShowSparkles(false), 600)
    }
    onChange()
  }, [checked, onChange])

  return (
    <motion.button
      role="checkbox"
      aria-checked={checked}
      aria-label={label ? `Mark "${label}" as ${checked ? 'incomplete' : 'complete'}` : (checked ? 'Mark as incomplete' : 'Mark as complete')}
      onClick={handleChange}
      className="relative w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
      style={{
        borderColor: checked ? 'var(--color-accent)' : 'var(--color-border-hover)',
        backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
    >
      {/* Check mark */}
      <motion.svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        initial={false}
        animate={checked ? 'checked' : 'unchecked'}
      >
        <motion.path
          d="M2 6L5 9L10 3"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            checked: { pathLength: 1, opacity: 1 },
            unchecked: { pathLength: 0, opacity: 0 },
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </motion.svg>

      {/* Background pulse on check */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: [0, 1.8, 2.2], opacity: [0.6, 0.2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
        )}
      </AnimatePresence>

      {/* Sparkle particles */}
      <AnimatePresence>
        {showSparkles && <Sparkles active={true} />}
      </AnimatePresence>
    </motion.button>
  )
}
