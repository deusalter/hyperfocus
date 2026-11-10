import { Pressable, Text, View } from 'react-native'
import { addDays as dfAddDays, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from '@/components/ui/Icon'
import { dayKey } from '@/lib/points'
import { useColors } from '@/lib/theme'
import { largeContent } from '@/lib/a11y'

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
  minDate,
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
  /** earlier days can be seen but not chosen */
  minDate?: string
}) {
  const palette = useColors()
  return (
    <View>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 2 }}>
        <Pressable
          onPress={() => onJump(offset - 1)}
          hitSlop={14}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          {...largeContent('Previous week')}
        >
          <ChevronLeft size={15} />
          <Text className="font-hk700 text-muted text-subhead" maxFontSizeMultiplier={1.4}>
            Prev
          </Text>
        </Pressable>
        {offset !== 0 ? (
          <Pressable onPress={() => onJump(0)} hitSlop={14} accessibilityRole="button">
            <Text className="font-hk700 text-accent text-footnote" maxFontSizeMultiplier={1.4}>
              Back to today
            </Text>
          </Pressable>
        ) : (
          <Text className="font-hk600 text-muted text-footnote" maxFontSizeMultiplier={1.4}>
            This week
          </Text>
        )}
        <Pressable
          onPress={() => onJump(offset + 1)}
          hitSlop={14}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Next week"
          {...largeContent('Next week')}
        >
          <Text className="font-hk700 text-muted text-subhead" maxFontSizeMultiplier={1.4}>
            Next
          </Text>
          <ChevronRight size={15} />
        </Pressable>
      </View>

      <View
        className="bg-surface border border-soft flex-row justify-between"
        style={{ borderRadius: 20, paddingVertical: 12, paddingHorizontal: 6, marginTop: 10 }}
      >
        {days.map((cell) => {
          const isSelected = cell.key === selected
          const isToday = cell.key === today
          const dots = dotsFor?.(cell.key) ?? []
          const count = dots.length
          const when = format(cell.date, 'EEEE, MMMM d')
          const disabled = !!minDate && cell.key < minDate
          return (
            <Pressable
              key={cell.key}
              onPress={() => onSelect(cell.key)}
              disabled={disabled}
              className="flex-1 items-center"
              style={{ gap: 6, opacity: disabled ? 0.35 : 1 }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`${isToday ? 'Today, ' : ''}${when}${count > 0 ? `, ${count} ${count === 1 ? 'task' : 'tasks'}` : ''}`}
              {...largeContent(format(cell.date, 'EEE d'))}
            >
              <Text className="font-hk700 text-muted text-caption" maxFontSizeMultiplier={1.2}>
                {cell.letter}
              </Text>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? palette.accent : 'transparent',
                  borderWidth: 1.5,
                  borderColor: isToday && !isSelected ? palette.accent : 'transparent',
                }}
              >
                <Text
                  className="font-hk800 text-subhead"
                  maxFontSizeMultiplier={1.2}
                  style={{
                    color: isSelected ? palette.onAccent : isToday ? palette.accent : palette.ink,
                  }}
                >
                  {cell.num}
                </Text>
              </View>
              <View className="flex-row" style={{ gap: 3, height: 5 }}>
                {dots.slice(0, 3).map((color, i) => (
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
