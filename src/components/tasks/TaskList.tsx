import { View, Text } from 'react-native'
import TaskItem from './TaskItem'
import { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskList({ tasks, onToggle, onDelete }: Props) {
  const incomplete = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  if (tasks.length === 0) {
    return (
      <View className="py-10">
        <Text
          className="text-muted-strong text-[28px]"
          style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}
        >
          Nothing here.
        </Text>
        <Text className="text-muted text-sm mt-1.5">Add a task above to get started.</Text>
      </View>
    )
  }

  return (
    <View>
      <View className="border-t border-border">
        {incomplete.map((t) => (
          <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </View>

      {completed.length > 0 && (
        <View className="mt-8">
          <Text className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Done ({completed.length})
          </Text>
          <View className="border-t border-border opacity-60">
            {completed.map((t) => (
              <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
