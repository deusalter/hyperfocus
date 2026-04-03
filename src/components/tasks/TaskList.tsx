'use client'

import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import { Task, TaskCategory } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onMove?: (id: string, category: TaskCategory) => void
  onUpdate?: (id: string, updates: Partial<Task>) => void
  showCategory?: boolean
}

export default function TaskList({ tasks, onToggle, onDelete, onMove, onUpdate, showCategory }: TaskListProps) {
  const incomplete = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="py-16 text-left"
      >
        <p className="display-xl text-[32px] sm:text-[40px] text-muted-strong">
          Nothing here.
        </p>
        <p className="text-sm text-muted mt-2">
          Add a task above, or press <kbd className="px-1.5 py-0.5 font-mono text-[10px] border border-border rounded">N</kbd> to jump in.
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-border border-t border-border">
        <AnimatePresence>
          {incomplete.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onMove={onMove}
              onUpdate={onUpdate}
              showCategory={showCategory}
            />
          ))}
        </AnimatePresence>
      </ul>

      {completed.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-2">
            Done <span className="tabular-nums ml-1">({completed.length})</span>
          </h3>
          <ul className="divide-y divide-border border-t border-border opacity-60">
            <AnimatePresence>
              {completed.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  showCategory={showCategory}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  )
}
