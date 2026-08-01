import { useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format, startOfWeek, addDays as dfAddDays } from 'date-fns'
import Svg, { Path } from 'react-native-svg'
import CatTag from '@/components/CatTag'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { dayKey } from '@/lib/points'
import { CATS, palette } from '@/lib/theme'
import { Task } from '@/lib/types'

function SyncIcon({ size = 13, color = palette.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/** Which calendar day a task belongs to — explicit due date, or today for the Today bucket. */
function taskDay(task: Task, todayISO: string): string | null {
  if (task.due) return task.due
  if (task.bucket === 'today') return todayISO
  return null
}

export default function CalendarScreen() {
  const router = useRouter()
  const { tasks, todayKey: todayISO } = useApp()
  const [selected, setSelected] = useState(todayISO)
  // The strip used to be pinned to the current week, so anything overdue sat
  // on a day you could not navigate to — invisible in the one view meant to
  // show you where things are.
  const [weekOffset, setWeekOffset] = useState(0)

  const week = useMemo(() => {
    const start = dfAddDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const date = dfAddDays(start, i)
      return { key: dayKey(date), letter: format(date, 'EEEEE'), num: date.getDate(), date }
    })
  }, [weekOffset])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (t.bucket === 'inbox') continue
      const day = taskDay(t, todayISO)
      if (!day) continue
      map.set(day, [...(map.get(day) ?? []), t])
    }
    return map
  }, [tasks, todayISO])

  const dayItems = byDay.get(selected) ?? []
  const overdue = useMemo(
    () => tasks.filter((t) => t.bucket !== 'inbox' && t.due && t.due < todayISO),
    [tasks, todayISO]
  )
  const canvasCount = tasks.filter((t) => t.source === 'canvas').length
  const selectedDate = new Date(`${selected}T12:00:00`)
  const monthLabel = format(week[0].date, 'MMMM yyyy')

  const jumpWeek = (delta: number) => {
    setWeekOffset((w) => {
      const next = w + delta
      const start = dfAddDays(startOfWeek(new Date(), { weekStartsOn: 1 }), next * 7)
      setSelected(next === 0 ? todayISO : dayKey(start))
      return next
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(260)} className="flex-row justify-between items-start">
          <View>
            <Text className="font-hk800 text-ink text-[24px]" style={{ letterSpacing: -0.5 }}>
              Calendar
            </Text>
            <Text className="font-hk400 text-muted text-[13px] mt-0.5">{monthLabel}</Text>
          </View>
          {canvasCount > 0 && (
            <View
              className="flex-row items-center bg-surface border border-soft rounded-full"
              style={{ gap: 6, paddingHorizontal: 11, paddingVertical: 6, marginTop: 4 }}
            >
              <SyncIcon />
              <Text className="font-hk700 text-ink text-[11px]">Canvas · {canvasCount}</Text>
            </View>
          )}
        </Animated.View>

        {/* week navigation */}
        <Animated.View
          entering={FadeInUp.delay(30).duration(260)}
          className="flex-row items-center justify-between mt-3.5"
          style={{ paddingHorizontal: 2 }}
        >
          <Pressable
            onPress={() => jumpWeek(-1)}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <Text className="font-hk700 text-muted text-[15px]">‹ Prev</Text>
          </Pressable>
          {weekOffset !== 0 ? (
            <Pressable
              onPress={() => {
                setWeekOffset(0)
                setSelected(todayISO)
              }}
              hitSlop={12}
              accessibilityRole="button"
            >
              <Text className="font-hk700 text-accent text-[12.5px]">Back to today</Text>
            </Pressable>
          ) : (
            <Text className="font-hk600 text-muted text-[12px]">This week</Text>
          )}
          <Pressable
            onPress={() => jumpWeek(1)}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <Text className="font-hk700 text-muted text-[15px]">Next ›</Text>
          </Pressable>
        </Animated.View>

        {/* week strip */}
        <Animated.View
          entering={FadeInUp.delay(40).duration(260)}
          className="bg-surface border border-soft flex-row justify-between mt-2"
          style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6 }}
        >
          {week.map((cell) => {
            const isSelected = cell.key === selected
            const isToday = cell.key === todayISO
            const dots = (byDay.get(cell.key) ?? []).slice(0, 3)
            return (
              <Pressable
                key={cell.key}
                onPress={() => setSelected(cell.key)}
                className="flex-1 items-center"
                style={{ gap: 6 }}
              >
                <Text className="font-hk700 text-muted text-[10px]">{cell.letter}</Text>
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
                    style={{
                      color: isSelected ? '#fff' : isToday ? palette.accent : palette.ink,
                    }}
                  >
                    {cell.num}
                  </Text>
                </View>
                <View className="flex-row" style={{ gap: 3, height: 5 }}>
                  {dots.map((t, i) => (
                    <View
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: CATS[t.cat ?? 'sprint'].color,
                      }}
                    />
                  ))}
                </View>
              </Pressable>
            )
          })}
        </Animated.View>

        {/* selected day */}
        <Animated.View entering={FadeInUp.delay(80).duration(260)}>
          <View className="flex-row items-baseline mt-4.5" style={{ gap: 8, marginTop: 18 }}>
            <Text className="font-hk800 text-ink text-[16px]" style={{ letterSpacing: -0.3 }}>
              {format(selectedDate, 'EEEE')}
            </Text>
            <Text className="font-hk400 text-muted text-[12.5px]">
              {format(selectedDate, 'MMMM d')}
            </Text>
          </View>

          <View className="mt-2.5" style={{ gap: 8 }}>
            {dayItems.map((item) => (
              <View
                key={item.id}
                className="bg-surface border border-soft flex-row items-center"
                style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
              >
                <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                <View className="flex-1" style={{ minWidth: 0 }}>
                  <Text className="font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                    {item.title}
                  </Text>
                  {item.course && (
                    <View className="flex-row items-center mt-1" style={{ gap: 5 }}>
                      <SyncIcon size={11} color={palette.muted} />
                      <Text className="font-hk600 text-muted text-[11px]">{item.course}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {dayItems.length === 0 && (
              <View className="items-center" style={{ paddingVertical: 22, paddingHorizontal: 10 }}>
                <Text className="font-hk400 text-muted text-[13px] text-center" style={{ lineHeight: 20 }}>
                  Nothing scheduled.{'\n'}A clear day is a good day.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* debrief link */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <PressableScale
            onPress={() => router.push('/debrief')}
            className="bg-accent-soft flex-row items-center mt-4.5"
            style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginTop: 18 }}
          >
            <View className="flex-1">
              <Text className="font-hk800 text-ink text-[13.5px]">Weekly debrief</Text>
              <Text className="font-hk400 text-muted text-[11.5px] mt-0.5">
                {overdue.length > 0
                  ? `${overdue.length} slipped past — decide once, calmly`
                  : "Nothing overdue. Take a look at what's coming"}
              </Text>
            </View>
            <Text className="font-hk800 text-accent text-[18px]">›</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
