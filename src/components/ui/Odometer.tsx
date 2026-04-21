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
 *
 * Baseline trick: an invisible "0" inside the column establishes natural font metrics
 * (width, height, baseline). The animated digit stack is absolutely positioned over it.
 * When `animate y` is `-${digit}em`, the target digit lands exactly where the invisible
 * anchor sits — so baselines and widths match the surrounding text at any font size,
 * regardless of glyph-specific quirks like the serif "1" sitting high in its em-box.
 */
function DigitColumn({ digit }: { digit: number }) {
  return (
    <span
      className="inline-block relative overflow-hidden tabular-nums align-baseline"
      style={{ lineHeight: 1 }}
      aria-hidden="true"
    >
      {/* Invisible anchor — sets width, height, and baseline from the real font */}
      <span className="invisible" aria-hidden="true">0</span>

      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{ lineHeight: 1 }}
        initial={false}
        animate={{ y: `-${digit}em` }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ height: '1em', lineHeight: 1 }}>
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
