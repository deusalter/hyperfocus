'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Zap, Clock } from 'lucide-react'
import { TaskCategory, EnergyLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddTaskProps {
  onAdd: (title: string, category?: TaskCategory) => void
  defaultCategory?: TaskCategory
}

export default function AddTask({ onAdd, defaultCategory = 'today' }: AddTaskProps) {
  const [value, setValue] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [energy, setEnergy] = useState<EnergyLevel | undefined>()
  const [category, setCategory] = useState<TaskCategory>(defaultCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim(), category)
    setValue('')
    setEnergy(undefined)
    setShowOptions(false)
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit}>
        <div className="glass flex items-center gap-3 px-4 py-3 focus-within:border-accent/30 transition-colors">
          <Plus className="w-5 h-5 text-muted shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a task... (Enter to save)"
            className="flex-1 bg-transparent text-foreground placeholder-muted/60 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="text-muted hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showOptions && 'rotate-180')} />
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass mt-2 p-3 flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-muted" />
                {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergy(energy === level ? undefined : level)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg transition-colors capitalize',
                      energy === level
                        ? level === 'low' ? 'bg-energy-low/20 text-energy-low' : level === 'medium' ? 'bg-energy-medium/20 text-energy-medium' : 'bg-energy-high/20 text-energy-high'
                        : 'text-muted hover:text-foreground bg-surface'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted" />
                {(['today', 'tomorrow', 'week', 'someday'] as TaskCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg transition-colors capitalize',
                      category === cat ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground bg-surface'
                    )}
                  >
                    {cat === 'week' ? 'This Week' : cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
