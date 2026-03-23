'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface OdometerProps {
  value: number
  className?: string
  minDigits?: number
}

/**
 * Digit-stack odometer — each digit is a vertical column that slides to its target.
 * Used for stat numbers and streak counts.
 */
function DigitColumn({ digit }: { digit: number }) {
  return (
    <span
      className="inline-block relative overflow-hidden tabular-nums"
      style={{ height: '1em', width: '0.62em', verticalAlign: 'baseline' }}
      aria-hidden="true"
    >
      <motion.span
        className="absolute left-0 right-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `-${digit}em` }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ height: '1em', lineHeight: '1em' }}>
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export default function Odometer({ value, className, minDigits = 1 }: OdometerProps) {
  const digits = useMemo(() => {
    const str = Math.max(0, Math.floor(value)).toString().padStart(minDigits, '0')
    return str.split('').map(Number)
  }, [value, minDigits])

  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {digits.map((d, i) => <DigitColumn key={i} digit={d} />)}
      </span>
    </span>
  )
}
