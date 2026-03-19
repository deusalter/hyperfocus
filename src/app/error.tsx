'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
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
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6"
      >
        <AlertTriangle className="w-10 h-10 text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2"
      >
        Something went wrong
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted mb-8 max-w-xs"
      >
        Don&apos;t worry — your data is safe. Try refreshing or head back to the dashboard.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
          Try Again
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
