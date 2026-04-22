import { useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

export default function QuickCapture() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const { addTask } = useTasks()

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    addTask(trimmed)
    setValue('')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  return (
    <View className="mb-8">
      <View
        className={cn(
          'flex-row items-center gap-3 border-b pb-3',
          focused ? 'border-accent' : 'border-border'
        )}
      >
        <Text className="font-mono text-muted text-xs">{'>'}</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={handleSubmit}
          placeholder="Type a thought, tap enter"
          placeholderTextColor="#6b6b75"
          returnKeyType="done"
          blurOnSubmit={false}
          className="flex-1 text-foreground text-[15px] py-1"
          accessibilityLabel="Quick capture a task"
        />
        {value.trim().length > 0 && (
          <Pressable onPress={handleSubmit} hitSlop={8}>
            <Text className="text-accent text-xs font-mono">save</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
