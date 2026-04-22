import { useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Plus } from 'lucide-react-native'
import { TaskCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  onAdd: (title: string, category: TaskCategory) => void
  defaultCategory: TaskCategory
}

export default function AddTask({ onAdd, defaultCategory }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed, defaultCategory)
    setValue('')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 border rounded-xl px-4 py-3 mb-4',
        focused ? 'border-accent bg-surface-hover' : 'border-border bg-surface'
      )}
    >
      <Plus size={18} color="#6b6b75" />
      <TextInput
        value={value}
        onChangeText={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        placeholder="Add a task…"
        placeholderTextColor="#6b6b75"
        returnKeyType="done"
        blurOnSubmit={false}
        className="flex-1 text-foreground text-[15px]"
        accessibilityLabel="Add task"
      />
      {value.trim().length > 0 && (
        <Pressable onPress={handleSubmit} hitSlop={8}>
          <Text className="text-accent text-xs font-mono">save</Text>
        </Pressable>
      )}
    </View>
  )
}
