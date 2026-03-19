'use client'

import { motion } from 'framer-motion'
import { Trash2, ChevronRight, Clock, Zap } from 'lucide-react'
import AnimatedCheckbox from '@/components/ui/AnimatedCheckbox'
import { Task, TaskCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onMove?: (id: string, category: TaskCategory) => void
  onUpdate?: (id: string, updates: Partial<Task>) => void
  showCategory?: boolean
}

const energyConfig = {
  low: {
    classes: 'bg-energy-low/10 text-energy-low',
    border: 'var(--color-energy-low)',
    label: 'Low',
  },
  medium: {
    classes: 'bg-energy-medium/10 text-energy-medium',
    border: 'var(--color-energy-medium)',
    label: 'Med',
  },
  high: {
    classes: 'bg-energy-high/10 text-energy-high',
    border: 'var(--color-energy-high)',
    label: 'High',
  },
}

export default function TaskItem({ task, onToggle, onDelete, onMove, showCategory }: TaskItemProps) {
  const categoryLabels: Record<TaskCategory, string> = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'This Week',
    someday: 'Someday',
  }

  const nextCategory: Record<TaskCategory, TaskCategory> = {
    today: 'tomorrow',
    tomorrow: 'week',
    week: 'someday',
    someday: 'today',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="glass flex items-center gap-3 px-4 py-3 group relative overflow-hidden"
      style={task.energyLevel && !task.completed ? {
        borderLeft: `2px solid ${energyConfig[task.energyLevel].border}`,
      } : undefined}
    >
      <AnimatedCheckbox
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm transition-all duration-300 block truncate',
            task.completed && 'line-through text-muted'
          )}
        >
          {task.title}
        </span>
        {showCategory && (
          <span className="text-[10px] text-muted">{categoryLabels[task.category]}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {task.timeEstimate && !task.completed && (
          <span className="text-[10px] text-muted flex items-center gap-0.5 bg-surface px-1.5 py-0.5 rounded-md">
            <Clock className="w-3 h-3" />
            {task.timeEstimate}m
          </span>
        )}

        {task.energyLevel && !task.completed && (
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5', energyConfig[task.energyLevel].classes)}>
            <Zap className="w-3 h-3" />
            {energyConfig[task.energyLevel].label}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {onMove && !task.completed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMove(task.id, nextCategory[task.category])}
              className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface transition-colors"
              title={`Move to ${categoryLabels[nextCategory[task.category]]}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            className="text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
