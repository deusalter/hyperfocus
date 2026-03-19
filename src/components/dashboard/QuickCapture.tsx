'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'

export default function QuickCapture() {
  const [value, setValue] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const { addTask } = useTasks()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    addTask(value.trim())
    setValue('')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass glass-input flex items-center gap-3 px-4 py-3">
          <Plus className="w-5 h-5 text-muted shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Capture a thought... (press Enter)"
            className="flex-1 bg-transparent text-foreground placeholder-muted/60 text-sm outline-none"
          />
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1 text-success text-xs font-medium"
              >
                <Zap className="w-3.5 h-3.5" />
                Added!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  )
}
