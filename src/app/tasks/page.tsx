'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTasks } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import AddTask from '@/components/tasks/AddTask'
import TaskList from '@/components/tasks/TaskList'
import CategoryTabs from '@/components/tasks/CategoryTabs'
import BrainDump from '@/components/tasks/BrainDump'
import { Task, TaskCategory } from '@/lib/types'

export default function TasksPage() {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('today')
  const { tasksByCategory, addTask, toggleTask, deleteTask, moveTask, updateTask, addBrainDumpTasks, tasks, restoreTask } = useTasks()
  const { toast } = useToast()
  const deletedTaskRef = useRef<Task | null>(null)

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
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted mt-0.5">
            {tasks.filter(t => !t.completed).length} remaining across all categories
          </p>
        </div>
        <BrainDump onDump={handleBrainDump} />
      </motion.div>

      <AddTask onAdd={handleAddTask} defaultCategory={activeCategory} />
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />
      <TaskList
        tasks={tasksByCategory(activeCategory)}
        onToggle={toggleTask}
        onDelete={handleDeleteTask}
        onMove={moveTask}
        onUpdate={updateTask}
      />
    </div>
  )
}
