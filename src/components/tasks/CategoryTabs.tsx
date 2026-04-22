import { View, Text, Pressable, ScrollView } from 'react-native'
import { TaskCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  active: TaskCategory
  onChange: (c: TaskCategory) => void
  counts: Record<TaskCategory, number>
}

const tabs: { key: TaskCategory; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
  { key: 'someday', label: 'Someday' },
]

export default function CategoryTabs({ active, onChange, counts }: Props) {
  return (
    <View className="border-b border-border mb-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-6"
      >
        {tabs.map((t) => {
          const isActive = active === t.key
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              className="py-3 relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View className="flex-row items-center gap-1.5">
                <Text className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted')}>
                  {t.label}
                </Text>
                {counts[t.key] > 0 && (
                  <Text className="text-[10px] font-mono text-muted tabular-nums">
                    {counts[t.key]}
                  </Text>
                )}
              </View>
              {isActive && (
                <View
                  className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent"
                />
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
