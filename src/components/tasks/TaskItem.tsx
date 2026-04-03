'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { Trash2, ChevronRight } from 'lucide-react'
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

const energyColor: Record<NonNullable<Task['energyLevel']>, string> = {
  low: 'var(--color-energy-low)',
  medium: 'var(--color-energy-medium)',
  high: 'var(--color-energy-high)',
}

const DELETE_THRESHOLD = -80
const SNAP_POINT = -72

export default function TaskItem({ task, onToggle, onDelete, onMove, showCategory }: TaskItemProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [showKeyboardActions, setShowKeyboardActions] = useState(false)
  const x = useMotionValue(0)
  const controls = useAnimation()

  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0])

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
      controls.start({ x: SNAP_POINT, transition: { type: 'spring', stiffness: 500, damping: 36 } })
      setIsRevealed(true)
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 36 } })
      setIsRevealed(false)
    }
  }

  const handleDeleteClick = () => {
    controls.start({
      x: -400,
      opacity: 0,
      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    }).then(() => onDelete(task.id))
  }

  const handleTap = () => {
    if (isRevealed) {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 36 } })
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center"
        style={{ opacity: deleteOpacity, background: 'var(--color-danger)' }}
      >
        <motion.button
          onClick={handleDeleteClick}
          className="flex flex-col items-center gap-0.5 text-background"
          whileTap={{ scale: 1.1 }}
          aria-label={`Delete task: ${task.title}`}
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Delete</span>
        </motion.button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: SNAP_POINT, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.4 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={controls}
        style={{ x }}
        className="flex items-center gap-3 px-0 py-3.5 group relative cursor-grab active:cursor-grabbing bg-background"
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
        {task.energyLevel && !task.completed && (
          <span
            aria-hidden="true"
            className="w-[3px] self-stretch rounded-full shrink-0"
            style={{ background: energyColor[task.energyLevel] }}
          />
        )}

        <AnimatedCheckbox
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          label={task.title}
        />

        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'text-[15px] block truncate transition-colors duration-300',
              task.completed && 'line-through text-muted'
            )}
          >
            {task.title}
          </span>
          {showCategory && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted mt-0.5 block">
              {categoryLabels[task.category]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.timeEstimate && !task.completed && (
            <span className="hidden sm:inline text-[11px] text-muted font-mono tabular-nums">
              {task.timeEstimate}m
            </span>
          )}

          {task.energyLevel && !task.completed && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: energyColor[task.energyLevel] }}
            >
              {task.energyLevel}
            </span>
          )}

          <div className={cn(
            'flex items-center gap-1 transition-opacity duration-150',
            showKeyboardActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 sm:flex hidden'
          )}>
            {onMove && !task.completed && (
              <button
                onClick={() => onMove(task.id, nextCategory[task.category])}
                className="text-muted hover:text-foreground p-1 transition-colors"
                title={`Move to ${categoryLabels[nextCategory[task.category]]}`}
                aria-label={`Move task to ${categoryLabels[nextCategory[task.category]]}`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onDelete(task.id)}
              className="text-muted hover:text-danger p-1 transition-colors"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
