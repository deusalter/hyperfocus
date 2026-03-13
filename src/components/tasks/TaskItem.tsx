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

const energyColors = {
  low: 'bg-energy-low/10 text-energy-low',
  medium: 'bg-energy-medium/10 text-energy-medium',
  high: 'bg-energy-high/10 text-energy-high',
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
      className="glass flex items-center gap-3 px-4 py-3 group"
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

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.timeEstimate && (
          <span className="text-[10px] text-muted flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {task.timeEstimate}m
          </span>
        )}

        {task.energyLevel && (
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', energyColors[task.energyLevel])}>
            <Zap className="w-3 h-3 inline" />
          </span>
        )}

        {onMove && !task.completed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onMove(task.id, nextCategory[task.category])}
            className="text-muted hover:text-foreground p-1"
            title={`Move to ${categoryLabels[nextCategory[task.category]]}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(task.id)}
          className="text-muted hover:text-danger p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  )
}
