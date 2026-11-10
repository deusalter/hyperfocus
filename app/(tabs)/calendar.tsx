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
import Group, { Divider } from '@/components/ui/Group'
import { ChevronRight, PlusIcon, SyncIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { dayKey } from '@/lib/points'
import { MAX_TITLE, noon } from '@/lib/tasks'
import { CATS, TITLE_SCALE, useColors } from '@/lib/theme'
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
        <Animated.View
          entering={FadeInUp.duration(260)}
          className="flex-row flex-wrap justify-between items-start"
          style={{ gap: 8 }}
        >
          <View>
            <Text
              className="font-hk800 text-ink text-title1"
              style={{ letterSpacing: -0.8 }}
              maxFontSizeMultiplier={TITLE_SCALE}
              accessibilityRole="header"
            >
              Calendar
            </Text>
            <Text className="font-hk500 text-muted text-footnote" style={{ marginTop: 1 }} maxFontSizeMultiplier={TITLE_SCALE}>
              {format(days[0].date, 'MMMM yyyy')}
            </Text>
          </View>
          {imported > 0 && (
            <View
              className="flex-row items-center bg-surface rounded-full"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6 }}
              accessible
              accessibilityLabel={`${imported} imported from ${importLabel}`}
            >
              <SyncIcon />
              <Text className="font-hk700 text-ink text-caption" maxFontSizeMultiplier={1.4}>
                {imported} from {importLabel}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(30).duration(260)} style={{ marginTop: 18 }}>
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
          <View className="flex-row flex-wrap items-baseline" style={{ columnGap: 8, marginTop: 24 }}>
            <Text
              className="font-hk800 text-ink text-title3"
              style={{ letterSpacing: -0.4 }}
              maxFontSizeMultiplier={TITLE_SCALE}
              accessibilityRole="header"
            >
              {format(selectedDate, 'EEEE')}
            </Text>
            <Text className="font-hk500 text-muted text-subhead">
              {format(selectedDate, 'MMMM d')}
            </Text>
          </View>

          {dayItems.length === 0 && finished.length === 0 && (
            <Text className="font-hk400 text-muted text-subhead" style={{ marginTop: 6 }}>
              Nothing scheduled. A clear day is a good day.
            </Text>
          )}

          {(dayItems.length > 0 || canAdd) && (
            <Group style={{ marginTop: 12 }}>
              {dayItems.map((item, i) => (
                <View key={item.id}>
                  {i > 0 && <Divider inset={56} />}
                  <Pressable
                    onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
                    className="flex-row items-center"
                    style={{ paddingLeft: 14, paddingRight: 14, paddingVertical: 13, gap: 12 }}
                    accessibilityRole="button"
                    // title first: built from its children it read "Sprint, Clear the desk"
                    accessibilityLabel={`${item.title}${item.course ? `, ${item.course}` : ''}, ${CATS[item.cat ?? 'sprint'].label}`}
                    accessibilityHint="Opens the task to edit it"
                  >
                    <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                    <View className="flex-1" style={{ minWidth: 0 }}>
                      <Text className="font-hk600 text-ink text-body">{item.title}</Text>
                      {item.course && (
                        <Text className="font-hk600 text-muted text-caption" style={{ marginTop: 3 }}>
                          {item.course}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={14} />
                  </Pressable>
                </View>
              ))}

              {canAdd && (
                <>
                  {dayItems.length > 0 && <Divider inset={56} />}
                  {adding ? (
                    <View
                      className="flex-row items-center"
                      style={{ paddingLeft: 14, paddingRight: 8, paddingVertical: 8, gap: 10 }}
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
                        className="flex-1 font-hk400 text-ink text-body"
                        style={{ paddingVertical: 8, paddingHorizontal: 2 }}
                      />
                      <PressableScale
                        haptic
                        onPress={submit}
                        className="bg-accent items-center justify-center"
                        style={{ width: 38, height: 38, borderRadius: 12 }}
                        accessibilityLabel="Add"
                      >
                        <PlusIcon />
                      </PressableScale>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setAdding(true)}
                      className="flex-row items-center"
                      style={{ paddingLeft: 16, paddingRight: 14, paddingVertical: 15, gap: 10 }}
                      accessibilityRole="button"
                    >
                      <PlusIcon size={14} color={palette.accent} strokeWidth={2.8} />
                      <Text className="font-hk700 text-accent text-subhead">
                        Add something for {selectedName}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </Group>
          )}

          {finished.length > 0 && (
            <>
              <Text
                className="font-hk700 text-muted text-footnote"
                style={{ marginTop: 22, marginBottom: 10, marginHorizontal: 2 }}
              >
                Finished
              </Text>
              <View style={{ gap: 10 }}>
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
                    <Text className="flex-1 font-hk500 text-muted text-subhead" numberOfLines={2}>
                      {c.title}
                    </Text>
                    {c.minutes > 0 && (
                      <Text className="font-hk600 text-muted text-footnote" accessibilityLabel={spoken(`${c.minutes}m`)}>
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
            style={{ borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, gap: 12, marginTop: 24 }}
          >
            <View className="flex-1">
              <Text className="font-hk800 text-ink text-headline">Weekly debrief</Text>
              <Text className="font-hk400 text-muted text-footnote" style={{ marginTop: 2 }}>
                {overdue.length > 0
                  ? `${overdue.length === 1 ? 'Something' : 'A few things'} slipped past. Decide once, calmly.`
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
