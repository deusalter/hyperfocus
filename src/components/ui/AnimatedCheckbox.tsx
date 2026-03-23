'use client'

import { motion } from 'framer-motion'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
}

export default function AnimatedCheckbox({ checked, onChange, label }: AnimatedCheckboxProps) {
  return (
    <motion.button
      role="checkbox"
      aria-checked={checked}
      aria-label={label ? `Mark "${label}" as ${checked ? 'incomplete' : 'complete'}` : (checked ? 'Mark as incomplete' : 'Mark as complete')}
      onClick={onChange}
      className="relative w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
      style={{
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: checked ? 'var(--color-accent)' : 'var(--color-border-hover)',
        backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
        transition: 'border-color 180ms, background-color 180ms',
      }}
      whileTap={{ scale: 0.88 }}
    >
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
          stroke="var(--color-accent-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            checked: { pathLength: 1, opacity: 1 },
            unchecked: { pathLength: 0, opacity: 0 },
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </motion.button>
  )
}
