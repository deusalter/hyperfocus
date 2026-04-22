import { View, Text, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Trash2 } from 'lucide-react-native'
import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress()
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={6}
      className={cn(
        'w-5 h-5 rounded-[5px] border-[1.5px] items-center justify-center',
        checked ? 'bg-accent border-accent' : 'border-border-hover bg-transparent'
      )}
    >
      {checked && (
        <Text className="text-accent-ink text-[10px] font-bold" style={{ marginTop: -1 }}>
          ✓
        </Text>
      )}
    </Pressable>
  )
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <View className="flex-row items-center gap-3 py-3.5 border-b border-border">
      {task.energyLevel && !task.completed && (
        <View
          className="w-[3px] self-stretch rounded-full"
          style={{
            backgroundColor:
              task.energyLevel === 'low' ? '#7dd3fc'
              : task.energyLevel === 'medium' ? '#fbbf24'
              : '#f87171',
          }}
        />
      )}
      <Checkbox checked={task.completed} onPress={() => onToggle(task.id)} />
      <Text
        className={cn(
          'text-[15px] flex-1',
          task.completed ? 'line-through text-muted' : 'text-foreground'
        )}
        numberOfLines={2}
      >
        {task.title}
      </Text>
      {task.energyLevel && !task.completed && (
        <Text
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{
            color:
              task.energyLevel === 'low' ? '#7dd3fc'
              : task.energyLevel === 'medium' ? '#fbbf24'
              : '#f87171',
          }}
        >
          {task.energyLevel}
        </Text>
      )}
      <Pressable
        onPress={() => onDelete(task.id)}
        hitSlop={8}
        accessibilityLabel={`Delete task: ${task.title}`}
      >
        <Trash2 size={16} color="#6b6b75" />
      </Pressable>
    </View>
  )
}
