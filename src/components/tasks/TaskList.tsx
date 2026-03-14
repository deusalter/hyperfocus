'use client'

import { AnimatePresence } from 'framer-motion'
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
      <div className="glass p-12 text-center">
        <p className="text-muted text-sm">Nothing here yet.</p>
        <p className="text-muted/60 text-xs mt-1">Add a task above to get started.</p>
      </div>
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
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2 opacity-60">
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
