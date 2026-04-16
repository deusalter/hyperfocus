'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Hyperfocus error:', error)
  }, [error])

  return (
    <div
      className="flex flex-col items-start justify-center min-h-[60vh] max-w-md"
      role="alert"
      aria-live="assertive"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] font-mono uppercase tracking-[0.14em] text-danger mb-3"
      >
        Error
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="display-xl text-[44px] sm:text-[56px] leading-none"
      >
        Something broke.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted mt-4 mb-8"
      >
        Your data is safe. Try again, or head back.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/">
          <Button>
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
