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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
          Today&apos;s Tasks
        </h2>
        {completedToday.length > 0 && (
          <span className="text-xs text-success font-medium">
            {completedToday.length} done today
          </span>
        )}
      </div>

      {displayTasks.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-muted text-sm">No tasks for today yet.</p>
          <p className="text-muted/60 text-xs mt-1">
            Use the quick capture above or press <kbd className="px-1.5 py-0.5 glass text-xs rounded">N</kbd> to add one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {displayTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                className="glass flex items-center gap-3 px-4 py-3"
              >
                <AnimatedCheckbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span
                  className={cn(
                    'text-sm transition-all duration-300 flex-1',
                    task.completed && 'line-through text-muted'
                  )}
                >
                  {task.title}
                </span>
                {task.energyLevel && (
                  <span
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full',
                      task.energyLevel === 'low' && 'bg-energy-low/10 text-energy-low',
                      task.energyLevel === 'medium' && 'bg-energy-medium/10 text-energy-medium',
                      task.energyLevel === 'high' && 'bg-energy-high/10 text-energy-high'
                    )}
                  >
                    {task.energyLevel}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {todayTasks.length > 5 && (
        <Link href="/tasks" className="mt-3 flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors">
          View all {todayTasks.length} tasks <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  )
}
