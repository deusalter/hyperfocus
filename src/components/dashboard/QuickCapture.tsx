'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export default function QuickCapture() {
  const [value, setValue] = useState('')
  const [showError, setShowError] = useState(false)
  const { addTask } = useTasks()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
      return
    }

    addTask(value.trim())
    setValue('')
    setShowError(false)
    toast('Captured', 'success', { duration: 1800 })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={showError ? { x: [0, -5, 5, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          className={cn(
            'glass-input flex items-center gap-3 px-0 py-3 border-b border-border transition-colors',
            showError ? 'border-danger/60' : 'focus-within:border-accent'
          )}
        >
          <span
            aria-hidden="true"
            className="font-mono text-xs text-muted pl-0.5 select-none"
            style={{ minWidth: '14px' }}
          >
            {'>'}
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (showError) setShowError(false)
            }}
            placeholder="Type a thought, press Enter"
            aria-label="Quick capture a task"
            aria-invalid={showError}
            aria-describedby={showError ? 'quick-capture-error' : undefined}
            className="flex-1 bg-transparent text-foreground placeholder-muted/50 text-[15px] outline-none"
          />
          <kbd className="text-[10px] text-muted font-mono border border-border rounded px-1.5 py-0.5 shrink-0">Enter</kbd>
        </motion.div>
        <AnimatePresence>
          {showError && (
            <motion.p
              id="quick-capture-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-danger mt-2"
              role="alert"
            >
              Type something first.
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  )
}
