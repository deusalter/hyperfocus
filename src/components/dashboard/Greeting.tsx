'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { getGreeting } from '@/lib/utils'

export default function Greeting() {
  const [greeting, setGreeting] = useState('Hello')
  const [date, setDate] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    setDate(format(new Date(), 'EEEE, MMMM d'))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 relative"
    >
      {/* Decorative gradient orb behind the greeting */}
      <div
        className="absolute -top-12 -left-8 w-48 h-48 rounded-full pointer-events-none opacity-30 blur-[60px]"
        style={{
          background: 'radial-gradient(circle, var(--color-accent), transparent 70%)',
        }}
      />
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight relative z-10">
        {greeting}{' '}
        <motion.span
          className="inline-block text-shimmer"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        >
          ✦
        </motion.span>
      </h1>
      <p className="text-muted mt-1.5 text-sm tracking-wide relative z-10">
        {date}
        <span className="mx-2 text-border">·</span>
        <span className="text-accent/70">Let&apos;s make it count</span>
      </p>
    </motion.div>
  )
}
