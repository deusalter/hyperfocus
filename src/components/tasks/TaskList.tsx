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
      <div className="glass p-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%)',
          }}
        />
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3 relative z-10">
          <span className="text-accent text-lg">✦</span>
        </div>
        <p className="text-muted text-sm relative z-10">Nothing here yet.</p>
        <p className="text-muted/60 text-xs mt-1 relative z-10">Add a task above to get started.</p>
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
