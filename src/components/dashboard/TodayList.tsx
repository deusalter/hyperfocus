import { View, Text, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { useTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
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

export default function TodayList() {
  const { todayTasks, toggleTask, completedToday } = useTasks()
  const display = todayTasks.slice(0, 5)

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-3">
        <Text className="text-[11px] font-mono uppercase tracking-widest text-muted">Today</Text>
        {completedToday.length > 0 && (
          <Text className="text-[11px] font-mono text-accent">{completedToday.length} done</Text>
        )}
      </View>

      {display.length === 0 ? (
        <View className="py-6">
          <Text
            className="text-muted-strong text-[26px]"
            style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}
          >
            Nothing yet.
          </Text>
          <Text className="text-muted text-sm mt-1.5">
            Capture a thought above, or go to Tasks for the full view.
          </Text>
        </View>
      ) : (
        <View className="border-t border-border">
          {display.map((task) => (
            <View
              key={task.id}
              className="flex-row items-center gap-3 py-3.5 border-b border-border"
            >
              <Checkbox checked={task.completed} onPress={() => toggleTask(task.id)} />
              <Text
                className={cn(
                  'text-[15px] flex-1',
                  task.completed ? 'line-through text-muted' : 'text-foreground'
                )}
                numberOfLines={1}
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
            </View>
          ))}
        </View>
      )}

      {todayTasks.length > 5 && (
        <Link href="/tasks" asChild>
          <Pressable className="mt-4" hitSlop={6}>
            <Text className="text-accent text-xs font-mono">View all {todayTasks.length} →</Text>
          </Pressable>
        </Link>
      )}
    </View>
  )
}
