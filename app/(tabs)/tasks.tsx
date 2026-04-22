import { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTasks } from '@/hooks/useTasks'
import AddTask from '@/components/tasks/AddTask'
import TaskList from '@/components/tasks/TaskList'
import CategoryTabs from '@/components/tasks/CategoryTabs'
import { TaskCategory } from '@/lib/types'

export default function TasksScreen() {
  const [active, setActive] = useState<TaskCategory>('today')
  const { tasks, tasksByCategory, addTask, toggleTask, deleteTask } = useTasks()

  const counts: Record<TaskCategory, number> = {
    today: tasks.filter((t) => t.category === 'today' && !t.completed).length,
    tomorrow: tasks.filter((t) => t.category === 'tomorrow' && !t.completed).length,
    week: tasks.filter((t) => t.category === 'week' && !t.completed).length,
    someday: tasks.filter((t) => t.category === 'someday' && !t.completed).length,
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-5 pt-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          <Text
            className="text-foreground text-[40px] leading-tight"
            style={{ fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: -0.5 }}
          >
            Tasks<Text className="text-accent">.</Text>
          </Text>
          <Text className="text-muted text-xs font-mono mt-1">
            {tasks.filter((t) => !t.completed).length} open · all categories
          </Text>
        </View>

        <AddTask onAdd={addTask} defaultCategory={active} />
        <CategoryTabs active={active} onChange={setActive} counts={counts} />

        <TaskList
          tasks={tasksByCategory(active)}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
