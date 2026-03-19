'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Inbox } from 'lucide-react'
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass p-12 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%)',
          }}
        />
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 relative z-10"
        >
          <Inbox className="w-6 h-6 text-accent/60" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-muted text-sm font-medium relative z-10"
        >
          Nothing here yet.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-muted/60 text-xs mt-1 relative z-10"
        >
          Add a task above to get started.
        </motion.p>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
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
      </div>

      {completed.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border" />
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Completed ({completed.length})
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2 opacity-50">
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
          </div>
        </div>
      )}
    </div>
  )
}
