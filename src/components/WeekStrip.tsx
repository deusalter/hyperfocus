import { Pressable, Text, View } from 'react-native'
import { addDays as dfAddDays, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from '@/components/ui/Icon'
import { dayKey } from '@/lib/points'
import { palette } from '@/lib/theme'

export interface WeekDay {
  key: string
  letter: string
  num: number
  date: Date
}

/** The Monday-to-Sunday week `offset` weeks from the one containing `today`. */
export function weekDays(today: string, offset: number): WeekDay[] {
  const start = dfAddDays(
    startOfWeek(new Date(`${today}T12:00:00`), { weekStartsOn: 1 }),
    offset * 7
  )
  return Array.from({ length: 7 }, (_, i) => {
    const date = dfAddDays(start, i)
    return { key: dayKey(date), letter: format(date, 'EEEEE'), num: date.getDate(), date }
  })
}

/** Previous / this week / next, above a strip of selectable days. */
export default function WeekStrip({
  days,
  today,
  selected,
  offset,
  onSelect,
  onJump,
  dotsFor,
}: {
  days: WeekDay[]
  today: string
  selected: string | null
  offset: number
  onSelect: (key: string) => void
  /** change week; 0 means back to the current one */
  onJump: (offset: number) => void
  /** colours of the small markers under a day */
  dotsFor?: (key: string) => string[]
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 2 }}>
        <Pressable
          onPress={() => onJump(offset - 1)}
          hitSlop={14}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Previous week"
        >
          <ChevronLeft size={15} />
          <Text className="font-hk700 text-muted text-[14px]">Prev</Text>
        </Pressable>
        {offset !== 0 ? (
          <Pressable onPress={() => onJump(0)} hitSlop={14} accessibilityRole="button">
            <Text className="font-hk700 text-accent text-[13px]">Back to today</Text>
          </Pressable>
        ) : (
          <Text className="font-hk600 text-muted text-[12.5px]">This week</Text>
        )}
        <Pressable
          onPress={() => onJump(offset + 1)}
          hitSlop={14}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <Text className="font-hk700 text-muted text-[14px]">Next</Text>
          <ChevronRight size={15} />
        </Pressable>
      </View>

      <View
        className="bg-surface border border-soft flex-row justify-between mt-2"
        style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6 }}
      >
        {days.map((cell) => {
          const isSelected = cell.key === selected
          const isToday = cell.key === today
          const dots = (dotsFor?.(cell.key) ?? []).slice(0, 3)
          const count = dotsFor?.(cell.key).length ?? 0
          const when = format(cell.date, 'EEEE, MMMM d')
          return (
            <Pressable
              key={cell.key}
              onPress={() => onSelect(cell.key)}
              className="flex-1 items-center"
              style={{ gap: 6 }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${isToday ? 'Today, ' : ''}${when}${count > 0 ? `, ${count} ${count === 1 ? 'task' : 'tasks'}` : ''}`}
            >
              <Text className="font-hk700 text-muted text-[11px]" maxFontSizeMultiplier={1.2}>
                {cell.letter}
              </Text>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? palette.accent : 'transparent',
                  borderWidth: 1.5,
                  borderColor: isToday && !isSelected ? palette.accent : 'transparent',
                }}
              >
                <Text
                  className="font-hk800 text-[13.5px]"
                  maxFontSizeMultiplier={1.2}
                  style={{
                    color: isSelected ? '#fff' : isToday ? palette.accent : palette.ink,
                  }}
                >
                  {cell.num}
                </Text>
              </View>
              <View className="flex-row" style={{ gap: 3, height: 5 }}>
                {dots.map((color, i) => (
                  <View
                    key={i}
                    style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }}
                  />
                ))}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
