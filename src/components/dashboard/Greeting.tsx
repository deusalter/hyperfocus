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
      className="mb-8"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        {greeting} <span className="text-accent">✦</span>
      </h1>
      <p className="text-muted mt-1 text-sm">{date}</p>
    </motion.div>
  )
}
