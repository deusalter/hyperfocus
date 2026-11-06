import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { format } from 'date-fns'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import WeekStrip, { weekDays } from '@/components/WeekStrip'
import { CatIcon } from '@/components/CatTag'
import UndoToast from '@/components/UndoToast'
import { useApp } from '@/store/AppStore'
import { useStartFocus } from '@/lib/useStartFocus'
import { MAX_TITLE, quickDates } from '@/lib/tasks'
import { CATS, CAT_ORDER, hexA, palette } from '@/lib/theme'

function Label({ children }: { children: string }) {
  return (
    <Text
      className="font-hk700 text-muted text-[11px]"
      style={{ letterSpacing: 0.4, marginTop: 20, marginBottom: 8, marginHorizontal: 2 }}
    >
      {children}
    </Text>
  )
}

function Choice({
  label,
  selected,
  onPress,
  hint,
}: {
  label: string
  selected: boolean
  onPress: () => void
  hint?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center"
      style={{
        paddingVertical: 9,
        paddingHorizontal: 13,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: selected ? palette.accent : palette.soft,
        backgroundColor: selected ? palette.accent : palette.surface,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={hint}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <Text
        className="font-hk700 text-[13px]"
        style={{ color: selected ? '#fff' : palette.ink }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * Everything about one task. Changes save as they're made: a Save button is one
 * more thing to remember on the way out, and forgetting it loses the edit.
 */
export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { hydrated, tasks, todayKey, updateTask, letGo, completeTask } = useApp()
  const start = useStartFocus()
  const task = tasks.find((t) => t.id === id)

  const [title, setTitle] = useState(task?.title ?? '')
  const [step, setStep] = useState(task?.firstStep ?? '')
  // fill the drafts once a cold-started task arrives from storage
  const loaded = !!task
  useEffect(() => {
    if (!loaded) return
    setTitle((t) => t || task?.title || '')
    setStep((s) => s || task?.firstStep || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])
  const [pickingDate, setPickingDate] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const days = useMemo(() => weekDays(todayKey, weekOffset), [todayKey, weekOffset])

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'))

  // The task can go out from under this screen, by finishing or letting it go.
  // Gated on hydrated: until storage loads every task looks missing, and a cold
  // start on this route would close itself before the task arrived.
  const gone = hydrated && !task
  useEffect(() => {
    if (gone) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gone])

  // The latest draft, flushed on the way out so swiping the sheet away mid-word
  // still keeps what was typed. An emptied title falls back to what it was.
  const drafts = useRef({ title, step })
  drafts.current = { title, step }
  const saved = useRef(task)
  saved.current = task
  const flush = () => {
    const t = saved.current
    if (!t) return
    const nextTitle = drafts.current.title.trim()
    const nextStep = drafts.current.step.trim()
    if (nextTitle && nextTitle !== t.title) updateTask(t.id, { title: nextTitle })
    if (nextStep !== (t.firstStep ?? '')) updateTask(t.id, { firstStep: nextStep || undefined })
  }
  useEffect(() => flush, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return <View className="flex-1 bg-background" />

  const cat = task.cat ?? 'sprint'
  const onToday = task.bucket === 'today' || task.due === todayKey
  const quick = quickDates(todayKey)
  const customDate = task.due && !quick.some((q) => q.key === task.due)

  const setDue = (due?: string) => {
    Haptics.selectionAsync().catch(() => {})
    updateTask(task.id, { due })
  }

  const moveTo = (bucket: 'today' | 'later') => {
    Haptics.selectionAsync().catch(() => {})
    // A date of today would keep pulling it back onto Today, undoing the choice
    // just made, so moving to Later has to clear it.
    updateTask(task.id, {
      bucket,
      due: bucket === 'later' && task.due === todayKey ? undefined : task.due,
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Task" onBack={close} />

          <TextInput
            value={title}
            onChangeText={setTitle}
            onEndEditing={flush}
            multiline
            maxLength={MAX_TITLE}
            placeholder="What is it?"
            placeholderTextColor={palette.muted}
            accessibilityLabel="Task title"
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            className="bg-surface border border-soft font-hk700 text-ink text-[18px] mt-4"
            style={{ borderRadius: 16, paddingHorizontal: 15, paddingTop: 13, paddingBottom: 13, lineHeight: 24 }}
          />
          {task.course && (
            <Text className="font-hk600 text-muted text-[12px] mt-2" style={{ marginHorizontal: 2 }}>
              {task.source === 'canvas' ? 'From Canvas' : 'From your calendar'} · {task.course}
            </Text>
          )}

          <Label>WHEN I START, I WILL…</Label>
          {/* The same if-then plan the focus screen asks for. Filling it in here
              means the move is already on the Start card before you commit. */}
          <TextInput
            value={step}
            onChangeText={setStep}
            onEndEditing={flush}
            maxLength={120}
            placeholder="open the doc and type one line"
            placeholderTextColor={palette.muted}
            accessibilityLabel="The very first move"
            returnKeyType="done"
            className="bg-surface border border-soft font-hk400 text-ink text-[14px]"
            style={{ borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12 }}
          />

          <Label>WHAT KIND</Label>
          <View className="flex-row" style={{ gap: 8 }}>
            {CAT_ORDER.map((c) => {
              const meta = CATS[c]
              const selected = c === cat
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {})
                    updateTask(task.id, { cat: c })
                  }}
                  className="flex-1 flex-row items-center justify-center"
                  style={{
                    gap: 6,
                    paddingVertical: 11,
                    borderRadius: 11,
                    backgroundColor: selected ? meta.textColor : hexA(meta.color, 0.13),
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${meta.label}. ${meta.blurb}`}
                >
                  <CatIcon cat={c} size={13} color={selected ? '#fff' : meta.color} />
                  <Text
                    className="font-hk800 text-[12.5px]"
                    style={{ color: selected ? '#fff' : meta.textColor }}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Text className="font-hk400 text-muted text-[12.5px] mt-2" style={{ marginHorizontal: 2 }}>
            {CATS[cat].blurb}
          </Text>

          <Label>WHEN</Label>
          <View className="flex-row flex-wrap" style={{ gap: 7 }}>
            <Choice label="No date" selected={!task.due} onPress={() => setDue(undefined)} />
            {quick.map((q) => (
              <Choice
                key={q.label}
                label={q.label}
                selected={task.due === q.key}
                onPress={() => setDue(q.key)}
              />
            ))}
            <Choice
              label={customDate ? format(new Date(`${task.due}T12:00:00`), 'MMM d') : 'Pick a date'}
              selected={!!customDate}
              onPress={() => setPickingDate((v) => !v)}
              hint="Shows a week of days to choose from"
            />
          </View>
          {pickingDate && (
            <View className="mt-3">
              <WeekStrip
                days={days}
                today={todayKey}
                selected={task.due ?? null}
                offset={weekOffset}
                onJump={setWeekOffset}
                onSelect={(key) => setDue(key)}
              />
            </View>
          )}

          <Label>WHICH LIST</Label>
          <View className="flex-row" style={{ gap: 8 }}>
            <View className="flex-1">
              <Choice label="Today" selected={onToday} onPress={() => moveTo('today')} />
            </View>
            <View className="flex-1">
              <Choice label="Later" selected={!onToday} onPress={() => moveTo('later')} />
            </View>
          </View>

          <PressableScale
            haptic
            onPress={() => {
              flush()
              close()
              start(task.id)
            }}
            className="bg-accent items-center"
            style={{ borderRadius: 16, paddingVertical: 15, marginTop: 26 }}
          >
            <Text className="font-hk700 text-white text-[15px]">Start focusing</Text>
          </PressableScale>
          <View className="flex-row mt-2.5" style={{ gap: 9 }}>
            <PressableScale
              haptic
              onPress={() => completeTask(task.id)}
              className="flex-1 items-center bg-surface border border-soft"
              style={{ borderRadius: 14, paddingVertical: 13 }}
            >
              <Text className="font-hk700 text-ink text-[14px]">Mark done</Text>
            </PressableScale>
            <PressableScale
              haptic
              onPress={() => letGo(task.id)}
              className="flex-1 items-center"
              style={{
                borderRadius: 14,
                paddingVertical: 13,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: palette.muted,
              }}
            >
              <Text className="font-hk600 text-muted text-[14px]">Let go</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <UndoToast />
    </SafeAreaView>
  )
}
