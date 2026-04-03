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
      className="flex gap-5 sm:gap-7 mb-5 border-b border-border overflow-x-auto scrollbar-none"
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
              'relative py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
              isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              <span className="sm:hidden">{cat.shortLabel}</span>
              <span className="hidden sm:inline">{cat.label}</span>
              <AnimatePresence mode="wait">
                {counts[cat.key] > 0 && (
                  <motion.span
                    key={counts[cat.key]}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="text-[10px] font-mono text-muted tabular-nums"
                  >
                    {counts[cat.key]}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {isActive && (
              <motion.div
                layoutId="categoryTab"
                className="absolute left-0 right-0 -bottom-px h-[2px]"
                style={{ background: 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
