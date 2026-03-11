'use client'

import { motion } from 'framer-motion'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: () => void
}

export default function AnimatedCheckbox({ checked, onChange }: AnimatedCheckboxProps) {
  return (
    <motion.button
      onClick={onChange}
      className="relative w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 shrink-0"
      style={{
        borderColor: checked ? 'var(--color-accent)' : 'var(--color-border-hover)',
        backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
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
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            checked: { pathLength: 1, opacity: 1 },
            unchecked: { pathLength: 0, opacity: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </motion.svg>
      {checked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-md bg-accent/30"
        />
      )}
    </motion.button>
  )
}
