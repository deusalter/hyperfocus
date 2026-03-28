'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '@/hooks/useTasks'
import AnimatedCheckbox from '@/components/ui/AnimatedCheckbox'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function TodayTasks() {
  const { todayTasks, toggleTask, completedToday } = useTasks()
  const displayTasks = todayTasks.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
          Today
        </h2>
        {completedToday.length > 0 && (
          <span className="text-[11px] font-mono text-accent tabular-nums">
            {completedToday.length} done
          </span>
        )}
      </div>

      {displayTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-10 text-left"
        >
          <p className="display-xl text-[28px] sm:text-[32px] text-muted-strong">
            Nothing yet.
          </p>
          <p className="text-sm text-muted mt-2">
            Capture a thought above, or press <kbd className="px-1.5 py-0.5 font-mono text-[10px] border border-border rounded">N</kbd> for the full task view.
          </p>
        </motion.div>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          <AnimatePresence>
            {displayTasks.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 py-3.5 group"
              >
                <AnimatedCheckbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  label={task.title}
                />
                <span
                  className={cn(
                    'text-[15px] flex-1 min-w-0 truncate transition-colors duration-300',
                    task.completed && 'line-through text-muted'
                  )}
                >
                  {task.title}
                </span>
                {task.energyLevel && !task.completed && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider shrink-0"
                    style={{
                      color:
                        task.energyLevel === 'low' ? 'var(--color-energy-low)'
                        : task.energyLevel === 'medium' ? 'var(--color-energy-medium)'
                        : 'var(--color-energy-high)',
                    }}
                  >
                    {task.energyLevel}
                  </span>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {todayTasks.length > 5 && (
        <Link
          href="/tasks"
          className="mt-4 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          View all {todayTasks.length} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  )
}
