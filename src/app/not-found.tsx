'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-center min-h-[60vh] max-w-md">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-3"
      >
        404
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="display-xl text-[56px] sm:text-[76px] leading-none"
      >
        Page wandered off.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted mt-4 mb-8"
      >
        Typical ADHD moment. Let&apos;s go home.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/">
          <Button>Back to dashboard</Button>
        </Link>
      </motion.div>
    </div>
  )
}
