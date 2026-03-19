'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TaskCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  active: TaskCategory
  onChange: (category: TaskCategory) => void
  counts: Record<TaskCategory, number>
}

const categories: { key: TaskCategory; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
  { key: 'someday', label: 'Someday' },
]

export default function CategoryTabs({ active, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 mb-4 p-1 glass rounded-xl overflow-x-auto">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-1',
            active === cat.key ? 'text-white' : 'text-muted hover:text-foreground'
          )}
        >
          {active === cat.key && (
            <motion.div
              layoutId="categoryTab"
              className="absolute inset-0 bg-accent/20 border border-accent/30 rounded-lg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            {cat.label}
            <AnimatePresence mode="wait">
              {counts[cat.key] > 0 && (
                <motion.span
                  key={counts[cat.key]}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={cn(
                    'text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center tabular-nums',
                    active === cat.key
                      ? 'bg-accent/30 text-white'
                      : 'bg-surface-elevated text-muted'
                  )}
                >
                  {counts[cat.key]}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      ))}
    </div>
  )
}
