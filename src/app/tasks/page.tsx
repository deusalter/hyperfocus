'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import AddTask from '@/components/tasks/AddTask'
import TaskList from '@/components/tasks/TaskList'
import CategoryTabs from '@/components/tasks/CategoryTabs'
import BrainDump from '@/components/tasks/BrainDump'
import { Task, TaskCategory } from '@/lib/types'

const categoryOrder: TaskCategory[] = ['today', 'tomorrow', 'week', 'someday']

const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
}

export default function TasksPage() {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('today')
  const [direction, setDirection] = useState(0)
  const { tasksByCategory, addTask, toggleTask, deleteTask, moveTask, updateTask, addBrainDumpTasks, tasks, restoreTask } = useTasks()
  const { toast } = useToast()
  const deletedTaskRef = useRef<Task | null>(null)

  const handleCategoryChange = useCallback((newCategory: TaskCategory) => {
    const oldIndex = categoryOrder.indexOf(activeCategory)
    const newIndex = categoryOrder.indexOf(newCategory)
    setDirection(newIndex > oldIndex ? 1 : -1)
    setActiveCategory(newCategory)
  }, [activeCategory])

  const handleAddTask = useCallback((title: string, category?: TaskCategory) => {
    addTask(title, category)
    toast('Task added', 'success', { duration: 2000 })
  }, [addTask, toast])

  const handleDeleteTask = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id)
    if (taskToDelete) {
      deletedTaskRef.current = { ...taskToDelete }
    }
    deleteTask(id)
    toast('Task deleted', 'undo', {
      duration: 5000,
      onUndo: () => {
        if (deletedTaskRef.current) {
          restoreTask(deletedTaskRef.current)
          deletedTaskRef.current = null
          toast('Task restored', 'success', { duration: 2000 })
        }
      },
    })
  }, [deleteTask, tasks, toast, restoreTask])

  const handleBrainDump = useCallback((text: string) => {
    const count = addBrainDumpTasks(text)
    toast(`${count} tasks created from brain dump`, 'success')
    return count
  }, [addBrainDumpTasks, toast])

  const counts: Record<TaskCategory, number> = {
    today: tasks.filter((t) => t.category === 'today' && !t.completed).length,
    tomorrow: tasks.filter((t) => t.category === 'tomorrow' && !t.completed).length,
    week: tasks.filter((t) => t.category === 'week' && !t.completed).length,
    someday: tasks.filter((t) => t.category === 'someday' && !t.completed).length,
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 mb-6"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5 truncate">
            {tasks.filter(t => !t.completed).length} remaining
            <span className="hidden sm:inline"> across all categories</span>
          </p>
        </div>
        <BrainDump onDump={handleBrainDump} />
      </motion.div>

      <AddTask onAdd={handleAddTask} defaultCategory={activeCategory} />
      <CategoryTabs active={activeCategory} onChange={handleCategoryChange} counts={counts} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeCategory}
          custom={direction}
          variants={contentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <TaskList
            tasks={tasksByCategory(activeCategory)}
            onToggle={toggleTask}
            onDelete={handleDeleteTask}
            onMove={moveTask}
            onUpdate={updateTask}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
