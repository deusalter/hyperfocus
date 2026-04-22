import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/utils'

interface Props {
  currentDuration: number
  onSelect: (sec: number) => void
  disabled: boolean
}

const presets = [
  { label: '15', sec: 15 * 60 },
  { label: '25', sec: 25 * 60 },
  { label: '45', sec: 45 * 60 },
  { label: '60', sec: 60 * 60 },
]

export default function TimerPresets({ currentDuration, onSelect, disabled }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-8 mb-2">
      {presets.map((p) => {
        const isActive = currentDuration === p.sec
        return (
          <Pressable
            key={p.label}
            onPress={() => !disabled && onSelect(p.sec)}
            disabled={disabled}
            className={cn('py-2 relative', disabled && 'opacity-50')}
            hitSlop={6}
            accessibilityLabel={`${p.label} minutes`}
            accessibilityState={{ selected: isActive, disabled }}
          >
            <Text
              className={cn(
                'text-sm font-mono tabular-nums',
                isActive ? 'text-foreground' : 'text-muted'
              )}
            >
              {p.label}
              <Text className="text-muted">m</Text>
            </Text>
            {isActive && (
              <View className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-accent" />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
