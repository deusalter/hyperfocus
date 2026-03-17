'use client'

import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
      >
        <Compass className="w-10 h-10 text-accent" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-2"
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted mb-8"
      >
        This page wandered off. Typical ADHD moment.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </motion.div>
    </div>
  )
}
