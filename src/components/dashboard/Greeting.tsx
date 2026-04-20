'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { getGreeting } from '@/lib/utils'
import { useScrambleText } from '@/hooks/useScrambleText'

export default function Greeting() {
  const [greeting, setGreeting] = useState('Hello')
  const [date, setDate] = useState('')
  const [mounted, setMounted] = useState(false)

  // Date/time depend on the client clock, so they're resolved after mount
  // to avoid SSR hydration mismatches.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setGreeting(getGreeting())
    setDate(format(new Date(), 'EEEE, MMMM d'))
    setMounted(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const scrambled = useScrambleText(mounted ? greeting : '', 520, [mounted])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      <h1 className="display-xl text-[44px] sm:text-[56px] md:text-[72px] tracking-tight">
        <span className="font-mono text-muted text-xs tracking-wider uppercase not-italic block mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          {date}
        </span>
        <span aria-live="polite">{scrambled || greeting}</span>
        <span className="inline-block ml-1 align-text-top" style={{ color: 'var(--color-accent)' }}>.</span>
      </h1>
      <p className="text-sm text-muted mt-2 max-w-sm">
        Capture what&apos;s in your head. Pick one thing. Start.
      </p>
    </motion.div>
  )
}
