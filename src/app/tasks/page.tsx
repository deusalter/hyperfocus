'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTasks } from '@/hooks/useTasks'
import AddTask from '@/components/tasks/AddTask'
import TaskList from '@/components/tasks/TaskList'
import CategoryTabs from '@/components/tasks/CategoryTabs'
import BrainDump from '@/components/tasks/BrainDump'
import { TaskCategory } from '@/lib/types'

export default function TasksPage() {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('today')
  const { tasksByCategory, addTask, toggleTask, deleteTask, moveTask, updateTask, addBrainDumpTasks, tasks } = useTasks()

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
        <BrainDump onDump={addBrainDumpTasks} />
      </motion.div>

      <AddTask onAdd={addTask} defaultCategory={activeCategory} />
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />
      <TaskList
        tasks={tasksByCategory(activeCategory)}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onMove={moveTask}
        onUpdate={updateTask}
      />
    </div>
  )
}
