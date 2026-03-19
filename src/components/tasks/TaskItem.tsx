'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
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

const DELETE_THRESHOLD = -80
const SNAP_POINT = -72

export default function TaskItem({ task, onToggle, onDelete, onMove, showCategory }: TaskItemProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [showKeyboardActions, setShowKeyboardActions] = useState(false)
  const x = useMotionValue(0)
  const controls = useAnimation()

  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.6, 0])
  const deleteScale = useTransform(x, [-100, -40, 0], [1, 0.8, 0.5])
  const deleteIconRotate = useTransform(x, [-100, -40, 0], [0, -10, -30])

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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset < DELETE_THRESHOLD || velocity < -500) {
      // Swiped past threshold — snap to reveal delete zone
      controls.start({ x: SNAP_POINT, transition: { type: 'spring', stiffness: 500, damping: 30 } })
      setIsRevealed(true)
    } else {
      // Spring back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } })
      setIsRevealed(false)
    }
  }

  const handleDeleteClick = () => {
    // Animate out then delete
    controls.start({
      x: -400,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' },
    }).then(() => onDelete(task.id))
  }

  const handleTap = () => {
    if (isRevealed) {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } })
      setIsRevealed(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      onDelete(task.id)
    }
    if (e.key === 'ArrowRight' && onMove && !task.completed) {
      e.preventDefault()
      onMove(task.id, nextCategory[task.category])
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Delete zone revealed behind the task */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-danger/90 rounded-r-2xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.button
          onClick={handleDeleteClick}
          className="flex flex-col items-center gap-0.5 text-white"
          style={{ scale: deleteScale, rotate: deleteIconRotate }}
          whileTap={{ scale: 1.2 }}
          aria-label={`Delete task: ${task.title}`}
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Delete</span>
        </motion.button>
      </motion.div>

      {/* Draggable task content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: SNAP_POINT, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.5 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={controls}
        style={task.energyLevel && !task.completed ? {
          x,
          borderLeft: `2px solid ${energyConfig[task.energyLevel].border}`,
        } : { x }}
        className="glass flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 group relative cursor-grab active:cursor-grabbing"
        tabIndex={0}
        role="listitem"
        aria-label={`${task.completed ? 'Completed: ' : ''}${task.title}${task.energyLevel ? `, ${task.energyLevel} energy` : ''}. Press Delete to remove${onMove && !task.completed ? ', Right Arrow to move' : ''}`}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowKeyboardActions(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setShowKeyboardActions(false)
          }
        }}
      >
        <AnimatedCheckbox
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          label={task.title}
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {task.timeEstimate && !task.completed && (
            <span className="hidden sm:flex text-[10px] text-muted items-center gap-0.5 bg-surface px-1.5 py-0.5 rounded-md">
              <Clock className="w-3 h-3" />
              {task.timeEstimate}m
            </span>
          )}

          {task.energyLevel && !task.completed && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5', energyConfig[task.energyLevel].classes)}>
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">{energyConfig[task.energyLevel].label}</span>
            </span>
          )}

          <div className={cn(
            'flex items-center gap-1 transition-all duration-200',
            showKeyboardActions ? 'opacity-100' : 'hidden sm:flex opacity-0 group-hover:opacity-100'
          )}>
            {onMove && !task.completed && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onMove(task.id, nextCategory[task.category])}
                className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface transition-colors"
                title={`Move to ${categoryLabels[nextCategory[task.category]]}`}
                aria-label={`Move task to ${categoryLabels[nextCategory[task.category]]}`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(task.id)}
              className="text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
