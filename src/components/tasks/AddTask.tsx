'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Zap, Clock } from 'lucide-react'
import { TaskCategory, EnergyLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddTaskProps {
  onAdd: (title: string, category?: TaskCategory, energyLevel?: EnergyLevel) => void
  defaultCategory?: TaskCategory
}

export default function AddTask({ onAdd, defaultCategory = 'today' }: AddTaskProps) {
  const [value, setValue] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [energy, setEnergy] = useState<EnergyLevel | undefined>()
  const [category, setCategory] = useState<TaskCategory>(defaultCategory)
  const [showError, setShowError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
      return
    }
    onAdd(value.trim(), category, energy)
    setValue('')
    setEnergy(undefined)
    setShowOptions(false)
    setShowError(false)
  }

  return (
    <div className="mb-5">
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={showError ? { x: [0, -5, 5, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          className={cn(
            'glass-input flex items-center gap-3 border border-border rounded-xl bg-surface px-4 py-3 transition-colors',
            showError ? 'border-danger/60' : 'focus-within:border-accent'
          )}
        >
          <Plus className="w-[18px] h-[18px] text-muted shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (showError) setShowError(false)
            }}
            placeholder="Add a task..."
            aria-label="New task title"
            aria-invalid={showError}
            aria-describedby={showError ? 'add-task-error' : undefined}
            className="flex-1 bg-transparent text-foreground placeholder-muted/50 text-[15px] outline-none"
          />
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="text-muted hover:text-foreground transition-colors"
            aria-label={showOptions ? 'Hide task options' : 'Show task options'}
            aria-expanded={showOptions}
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showOptions && 'rotate-180')} />
          </button>
        </motion.div>
        <AnimatePresence>
          {showError && (
            <motion.p
              id="add-task-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-danger mt-1.5 ml-1"
              role="alert"
            >
              Type something first.
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 border border-border rounded-xl p-3 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 bg-surface">
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Energy level">
                <Zap className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergy(energy === level ? undefined : level)}
                    aria-pressed={energy === level}
                    aria-label={`${level} energy`}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full transition-colors capitalize border',
                      energy === level
                        ? 'border-foreground text-foreground'
                        : 'border-border text-muted hover:text-foreground hover:border-border-hover'
                    )}
                    style={
                      energy === level
                        ? {
                            color:
                              level === 'low' ? 'var(--color-energy-low)'
                              : level === 'medium' ? 'var(--color-energy-medium)'
                              : 'var(--color-energy-high)',
                            borderColor:
                              level === 'low' ? 'var(--color-energy-low)'
                              : level === 'medium' ? 'var(--color-energy-medium)'
                              : 'var(--color-energy-high)',
                          }
                        : undefined
                    }
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Category">
                <Clock className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                {(['today', 'tomorrow', 'week', 'someday'] as TaskCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                    aria-label={cat === 'week' ? 'This Week' : cat}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full transition-colors capitalize whitespace-nowrap border',
                      category === cat
                        ? 'border-accent text-accent'
                        : 'border-border text-muted hover:text-foreground hover:border-border-hover'
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
