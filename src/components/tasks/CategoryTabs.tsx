'use client'

import { useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TaskCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  active: TaskCategory
  onChange: (category: TaskCategory) => void
  counts: Record<TaskCategory, number>
}

const categories: { key: TaskCategory; label: string; shortLabel: string }[] = [
  { key: 'today', label: 'Today', shortLabel: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow', shortLabel: 'Tmrw' },
  { key: 'week', label: 'This Week', shortLabel: 'Week' },
  { key: 'someday', label: 'Someday', shortLabel: 'Later' },
]

export default function CategoryTabs({ active, onChange, counts }: CategoryTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (index + 1) % categories.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (index - 1 + categories.length) % categories.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = categories.length - 1
    }

    if (nextIndex !== null) {
      tabRefs.current[nextIndex]?.focus()
      onChange(categories[nextIndex].key)
    }
  }, [onChange])

  return (
    <div
      role="tablist"
      aria-label="Task categories"
      className="flex gap-0.5 sm:gap-1 mb-4 p-1 glass rounded-xl overflow-x-auto scrollbar-none"
    >
      {categories.map((cat, index) => {
        const isActive = active === cat.key
        return (
          <button
            key={cat.key}
            ref={(el) => { tabRefs.current[index] = el }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${cat.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(cat.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-w-0 flex-1',
              isActive ? 'text-white' : 'text-muted hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="categoryTab"
                className="absolute inset-0 bg-accent/20 border border-accent/30 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5">
              <span className="sm:hidden">{cat.shortLabel}</span>
              <span className="hidden sm:inline">{cat.label}</span>
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
                      isActive
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
        )
      })}
    </div>
  )
}
