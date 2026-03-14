'use client'

import { motion } from 'framer-motion'
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
          <span className="relative z-10">
            {cat.label}
            {counts[cat.key] > 0 && (
              <span className="ml-1.5 text-xs text-muted">
                {counts[cat.key]}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
