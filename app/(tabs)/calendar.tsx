import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import Svg, { Path } from 'react-native-svg'
import CatTag from '@/components/CatTag'
import WeekStrip, { weekDays } from '@/components/WeekStrip'
import PressableScale from '@/components/ui/PressableScale'
import { ChevronRight, PlusIcon, SyncIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { dayKey } from '@/lib/points'
import { MAX_TITLE, noon } from '@/lib/tasks'
import { useColors } from '@/lib/theme'
import { spoken } from '@/lib/speech'
import { Task } from '@/lib/types'

/** Which calendar day a task belongs to — explicit due date, or today for the Today bucket. */
function taskDay(task: Task, todayISO: string): string | null {
  if (task.due) return task.due
  if (task.bucket === 'today') return todayISO
  return null
}

export default function CalendarScreen() {
  const palette = useColors()
  const router = useRouter()
  const { tasks, history, overdue, addTask, todayKey: todayISO } = useApp()
  const [selected, setSelected] = useState(todayISO)
  // The strip used to be pinned to the current week, so anything overdue sat
  // on a day you could not navigate to — invisible in the one view meant to
  // show you where things are.
  const [weekOffset, setWeekOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<TextInput>(null)

  // left open overnight, "today" moves on and the selection should move with it
  const prevToday = useRef(todayISO)
  useEffect(() => {
    if (prevToday.current === todayISO) return
    if (selected === prevToday.current && weekOffset === 0) setSelected(todayISO)
    prevToday.current = todayISO
  }, [todayISO, selected, weekOffset])

  const days = useMemo(() => weekDays(todayISO, weekOffset), [todayISO, weekOffset])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (t.bucket === 'inbox') continue
      const day = taskDay(t, todayISO)
      if (!day) continue
      const list = map.get(day)
      if (list) list.push(t)
      else map.set(day, [t])
    }
    return map
  }, [tasks, todayISO])

  const dayItems = byDay.get(selected) ?? []
  // What got finished that day, so looking back shows something other than blanks.
  const finished = useMemo(
    () => history.filter((c) => dayKey(new Date(c.completedAt)) === selected),
    [history, selected]
  )
  const imported = tasks.filter((t) => t.source).length
  const importLabel = tasks.some((t) => t.source === 'canvas') ? 'Canvas' : 'Calendar'
  const selectedDate = noon(selected)
  const selectedName = selected === todayISO ? 'today' : format(selectedDate, 'EEEE')
  const canAdd = selected >= todayISO

  const jumpWeek = (next: number) => {
    setWeekOffset(next)
    setSelected(next === 0 ? todayISO : weekDays(todayISO, next)[0].key)
    setAdding(false)
  }

  const submit = () => {
    if (!draft.trim()) {
      setAdding(false)
      return
    }
    addTask(draft, { due: selected, bucket: selected === todayISO ? 'today' : 'later' })
    setDraft('')
    // stays open: a day's worth of things tends to arrive together
    inputRef.current?.focus()
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <Animated.View entering={FadeInUp.duration(260)} className="flex-row justify-between items-start">
          <View>
            <Text
              className="font-hk800 text-ink text-[24px]"
              style={{ letterSpacing: -0.5 }}
              accessibilityRole="header"
            >
              Calendar
            </Text>
            <Text className="font-hk400 text-muted text-[13px] mt-0.5">
              {format(days[0].date, 'MMMM yyyy')}
            </Text>
          </View>
          {imported > 0 && (
            <View
              className="flex-row items-center bg-surface border border-soft rounded-full"
              style={{ gap: 6, paddingHorizontal: 11, paddingVertical: 6, marginTop: 4 }}
              accessible
              accessibilityLabel={`${imported} imported from ${importLabel}`}
            >
              <SyncIcon />
              <Text className="font-hk700 text-ink text-[11px]">
                {importLabel} · {imported}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(30).duration(260)} className="mt-3.5">
          <WeekStrip
            days={days}
            today={todayISO}
            selected={selected}
            offset={weekOffset}
            onSelect={(key) => {
              setSelected(key)
              setAdding(false)
            }}
            onJump={jumpWeek}
            dotsFor={(key) => (byDay.get(key) ?? []).map((t) => palette.cats[t.cat ?? 'sprint'].color)}
          />
        </Animated.View>

        {/* selected day */}
        <Animated.View entering={FadeInUp.delay(80).duration(260)}>
          <View className="flex-row items-baseline" style={{ gap: 8, marginTop: 18 }}>
            <Text
              className="font-hk800 text-ink text-[16px]"
              style={{ letterSpacing: -0.3 }}
              accessibilityRole="header"
            >
              {format(selectedDate, 'EEEE')}
            </Text>
            <Text className="font-hk400 text-muted text-[13px]">
              {format(selectedDate, 'MMMM d')}
            </Text>
          </View>

          <View className="mt-2.5" style={{ gap: 8 }}>
            {dayItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
                className="bg-surface border border-soft flex-row items-center"
                style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
                accessibilityRole="button"
                accessibilityHint="Opens the task to edit it"
              >
                <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                <View className="flex-1" style={{ minWidth: 0 }}>
                  <Text className="font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                    {item.title}
                  </Text>
                  {item.course && (
                    <Text className="font-hk600 text-muted text-[11px] mt-1">{item.course}</Text>
                  )}
                </View>
                <ChevronRight size={14} />
              </Pressable>
            ))}

            {dayItems.length === 0 && finished.length === 0 && (
              <View className="items-center" style={{ paddingVertical: 16, paddingHorizontal: 10 }}>
                <Text className="font-hk400 text-muted text-[13px] text-center" style={{ lineHeight: 20 }}>
                  Nothing scheduled.{'\n'}A clear day is a good day.
                </Text>
              </View>
            )}

            {canAdd &&
              (adding ? (
                <View
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingLeft: 10, paddingRight: 6, paddingVertical: 5, gap: 8 }}
                >
                  <TextInput
                    ref={inputRef}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submit}
                    submitBehavior="submit"
                    autoFocus
                    maxLength={MAX_TITLE}
                    placeholder={`Something for ${selectedName}`}
                    placeholderTextColor={palette.muted}
                    returnKeyType="done"
                    accessibilityLabel={`Add something for ${selectedName}`}
                    className="flex-1 font-hk400 text-ink text-[14px]"
                    style={{ paddingVertical: 8, paddingHorizontal: 3 }}
                  />
                  <PressableScale
                    haptic
                    onPress={submit}
                    className="bg-accent items-center justify-center"
                    style={{ width: 36, height: 36, borderRadius: 11 }}
                    accessibilityLabel="Add"
                  >
                    <PlusIcon />
                  </PressableScale>
                </View>
              ) : (
                <Pressable
                  onPress={() => setAdding(true)}
                  className="flex-row items-center justify-center"
                  style={{
                    borderRadius: 14,
                    paddingVertical: 13,
                    gap: 7,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: palette.muted,
                  }}
                  accessibilityRole="button"
                >
                  <PlusIcon size={13} color={palette.accent} strokeWidth={2.8} />
                  <Text className="font-hk700 text-accent text-[13px]">
                    Add something for {selectedName}
                  </Text>
                </Pressable>
              ))}
          </View>

          {finished.length > 0 && (
            <>
              <Text
                className="font-hk700 text-muted text-[11px]"
                style={{ letterSpacing: 0.4, marginTop: 18, marginBottom: 8, marginHorizontal: 2 }}
              >
                FINISHED
              </Text>
              <View style={{ gap: 7 }}>
                {finished.map((c) => (
                  <View
                    key={c.id}
                    className="flex-row items-center"
                    style={{ paddingHorizontal: 4, gap: 10 }}
                    accessible
                    accessibilityLabel={`Finished ${c.title}${c.minutes > 0 ? `, ${c.minutes} minutes` : ''}`}
                  >
                    <Svg width={15} height={15} viewBox="0 0 24 24">
                      <Path
                        d="M5 12.5 10 17.5 19 7"
                        stroke={palette.accent}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                    <Text className="flex-1 font-hk500 text-muted text-[13.5px]" numberOfLines={2}>
                      {c.title}
                    </Text>
                    {c.minutes > 0 && (
                      <Text className="font-hk600 text-muted text-[12px]" accessibilityLabel={spoken(`${c.minutes}m`)}>
                        {c.minutes}m
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>

        {/* debrief link */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <PressableScale
            onPress={() => router.push('/debrief')}
            className="bg-accent-soft flex-row items-center"
            style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginTop: 18 }}
          >
            <View className="flex-1">
              <Text className="font-hk800 text-ink text-[13.5px]">Weekly debrief</Text>
              <Text className="font-hk400 text-muted text-[12px] mt-0.5">
                {overdue.length > 0
                  ? `${overdue.length} slipped past. Decide once, calmly.`
                  : "Nothing overdue. Take a look at what's coming."}
              </Text>
            </View>
            <ChevronRight size={16} color={palette.accent} strokeWidth={2.8} />
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
