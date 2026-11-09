import { useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  View,
  Text,
  TextInput,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { SoundIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { CATS, useColors } from '@/lib/theme'
import { formatClock, scoreCompletion } from '@/lib/points'
import { canAdjust, focusedMinutes, remainingSec } from '@/lib/session'
import { goBackOrHome } from '@/lib/nav'
import { SOUNDS, SOUND_ORDER } from '@/lib/sound'
import { GLIDE } from '@/lib/motion'

const R = 94
const CIRCUMFERENCE = 2 * Math.PI * R
const RING_MAX = 212
const STEP_MIN = 5
/** room for a side button and its gap on each side of the ring, plus screen padding */
const RING_CHROME = 144

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function AdjustButton({
  label,
  a11y,
  disabled,
  onPress,
}: {
  label: string
  a11y: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {})
        onPress()
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      className="bg-surface border border-soft items-center justify-center"
      style={{ width: 44, height: 44, borderRadius: 22, opacity: disabled ? 0.4 : 1 }}
    >
      <Text className="font-hk700 text-ink text-[13px]" maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function FocusScreen() {
  const palette = useColors()
  useKeepAwake() // a focus session shouldn't die to auto-lock
  const router = useRouter()
  const { width } = useWindowDimensions()
  const {
    hydrated,
    focus,
    focusTask,
    recapPending,
    settings,
    toggleFocusRun,
    adjustFocus,
    finishFocus,
    abandonFocus,
    updateTask,
    updateSettings,
  } = useApp()
  const [stepDraft, setStepDraft] = useState('')
  const [showStepInput, setShowStepInput] = useState(false)

  // This screen owns the display clock — the rest of the app never re-renders per
  // tick. Ending the session is the store's job, so it happens wherever you are.
  // The tick is aimed at the next whole-second boundary rather than polling on a
  // fixed interval, so the digits change exactly when they should (a 500ms poll
  // drifts and visibly skips a second) at half the renders. The tick only asks for
  // a redraw. The time itself is read fresh below, because a stored "now" is out of
  // date on the very render where Resume moves the end time.
  const [, redraw] = useState(0)
  const endsAt = focus?.endsAt
  const running = focus?.running
  useEffect(() => {
    if (!running || endsAt == null) return
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      redraw((n) => n + 1)
      const untilBoundary = ((endsAt - Date.now()) % 1000 + 1000) % 1000
      timer = setTimeout(tick, untilBoundary || 1000)
    }
    tick()
    // a backgrounded timer gets throttled; resync the moment we're back
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        clearTimeout(timer)
        tick()
      }
    })
    return () => {
      clearTimeout(timer)
      sub.remove()
    }
  }, [running, endsAt])

  const now = Date.now()
  const focusRemaining = focus ? remainingSec(focus, now) : 0

  const reduced = useReducedMotion()
  const progress = useSharedValue(0)

  // One continuous UI-thread sweep for the whole session — smooth, zero JS
  // involvement. A single slow sweep has no repeated motion onsets, so unlike
  // a pulsing indicator it never re-grabs attention mid-task. Pause cancels;
  // resume re-aims at 1. Under Reduce Motion it steps with the clock instead.
  useEffect(() => {
    if (!focus) return
    if (focus.running) {
      const remainingMs = Math.max(0, focus.endsAt - Date.now())
      progress.value = 1 - remainingMs / (focus.totalSec * 1000)
      if (!reduced) {
        progress.value = withTiming(1, { duration: remainingMs, easing: Easing.linear })
      }
    } else {
      cancelAnimation(progress)
      progress.value = 1 - focus.pausedRemaining / focus.totalSec
    }
    return () => cancelAnimation(progress)
  }, [focus?.running, focus?.endsAt, focus?.totalSec, focus?.pausedRemaining, progress, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reduce Motion: no sweep, so redraw the arc on each visible tick.
  useEffect(() => {
    if (!reduced || !focus) return
    progress.value = 1 - focusRemaining / focus.totalSec
  }, [reduced, focusRemaining, focus, progress])

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }))

  // the ring dims when paused, so the state reads from across a desk
  const dim = useSharedValue(1)
  useEffect(() => {
    dim.value = withTiming(running === false ? 0.45 : 1, GLIDE)
  }, [running, dim])
  const ringDim = useAnimatedStyle(() => ({ opacity: dim.value }))

  // Session ended (clock ran out or finished elsewhere) → recap. No recap means it
  // was stopped, so just go back to wherever this was opened from. Gated on
  // `hydrated`: storage loads async, so an un-gated check treats the startup window
  // as "no session" and evicts you before a restored one lands.
  useEffect(() => {
    if (!hydrated || focus) return
    if (recapPending) router.replace('/recap')
    else goBackOrHome(router)
  }, [hydrated, focus, recapPending, router])

  if (!focus) return <View className="flex-1 bg-background" />

  const cat = focusTask?.cat ?? focus.cat ?? 'sprint'
  const meta = CATS[cat]
  const title = focusTask?.title ?? focus.title ?? 'One thing'
  // the same sum Done is about to bank, so the number doesn't change on the recap
  const livePts = scoreCompletion(cat, focusedMinutes(focus, now))
  const ring = Math.min(RING_MAX, width - RING_CHROME)
  const ringScale = ring / RING_MAX
  const leftMin = Math.ceil(focusRemaining / 60)

  const sound = settings.sound
  const soundLabel = sound === 'off' ? 'Sound' : SOUNDS[sound].short
  const nextSound = () => {
    Haptics.selectionAsync().catch(() => {})
    const i = SOUND_ORDER.indexOf(sound)
    updateSettings({ sound: SOUND_ORDER[(i + 1) % SOUND_ORDER.length] })
  }

  const stop = () => {
    // nothing much to lose in the first minute, usually a mis-tap on the wrong task
    if (focus.totalSec - focusRemaining < 60) {
      abandonFocus()
      return
    }
    Alert.alert(
      'Stop this session?',
      "These minutes won't count. The task stays on your list.",
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: abandonFocus },
      ]
    )
  }

  const saveStep = () => {
    if (focusTask && stepDraft.trim()) {
      updateTask(focusTask.id, { firstStep: stepDraft.trim() })
    }
    setShowStepInput(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 items-center" style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
        <View className="self-stretch">
          {/* Back keeps the session going. It always has somewhere to be seen,
              the banner on Home, and walking away shouldn't be a way to lose it. */}
          <ScreenHeader
            title="Focus"
            variant="back"
            onBack={() => goBackOrHome(router)}
            right={
              <Pressable
                onPress={nextSound}
                hitSlop={8}
                className="flex-row items-center bg-surface border border-soft rounded-full"
                style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 7 }}
                accessibilityRole="button"
                accessibilityLabel={
                  sound === 'off'
                    ? 'Focus sound off. Double tap to turn on.'
                    : `Focus sound ${SOUNDS[sound].label}. Double tap to change.`
                }
              >
                <SoundIcon
                  size={15}
                  off={sound === 'off'}
                  color={sound === 'off' ? palette.muted : palette.accent}
                />
                <Text
                  className="font-hk700 text-[12px]"
                  style={{ color: sound === 'off' ? palette.muted : palette.accent }}
                  maxFontSizeMultiplier={1.3}
                >
                  {soundLabel}
                </Text>
              </Pressable>
            }
          />
        </View>

        {/* the session block owns the space between header and controls, so
            the ring sits optically centred instead of stranded up top */}
        {/* Centred when it fits, which is always at default sizes. At the largest
            text sizes it scrolls rather than spilling over the header and buttons. */}
        <ScrollView
          className="flex-1 self-stretch"
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text className="font-hk600 text-muted text-[11px]" style={{ letterSpacing: 0.4 }}>
            FOCUSING ON
          </Text>
          <Text
            className="font-hk700 text-ink text-center text-[17px] mt-1"
            style={{ lineHeight: 22, paddingHorizontal: 10 }}
            numberOfLines={3}
          >
            {title}
          </Text>

          {focusTask?.firstStep ? (
            <View
              className="bg-accent-soft rounded-[16px] mt-2"
              style={{ paddingHorizontal: 13, paddingVertical: 7, maxWidth: 280 }}
            >
              <Text className="font-hk600 text-accent text-center text-[12.5px]" style={{ lineHeight: 17 }}>
                Start by: {focusTask.firstStep}
              </Text>
            </View>
          ) : showStepInput ? (
            <View className="mt-2" style={{ width: '100%', maxWidth: 300 }}>
              {/* An if-then plan, not a note. Naming the concrete physical
                  action is what closes the gap between intending and starting —
                  the activation cost is in specifying the move, not in wanting
                  the goal. */}
              <Text className="font-hk700 text-muted text-center text-[11px]" style={{ letterSpacing: 0.3 }}>
                WHEN I START, I WILL…
              </Text>
              <View className="flex-row mt-1.5" style={{ gap: 7 }}>
                <TextInput
                  value={stepDraft}
                  onChangeText={setStepDraft}
                  onSubmitEditing={saveStep}
                  autoFocus
                  maxLength={120}
                  placeholder="open the doc and type one line"
                  placeholderTextColor={palette.muted}
                  returnKeyType="done"
                  accessibilityLabel="The very first move"
                  className="flex-1 bg-surface border border-soft font-hk400 text-ink text-[13px]"
                  style={{ borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9 }}
                />
                <PressableScale
                  onPress={saveStep}
                  className="bg-accent items-center justify-center"
                  style={{ borderRadius: 11, paddingHorizontal: 14 }}
                >
                  <Text className="font-hk700 text-on-accent text-[13px]">Set</Text>
                </PressableScale>
              </View>
            </View>
          ) : (
            focusTask && (
              <Pressable
                onPress={() => setShowStepInput(true)}
                hitSlop={14}
                className="mt-2"
                accessibilityRole="button"
              >
                <Text className="font-hk700 text-accent text-[12.5px]">
                  Can&apos;t start? Name the very first move
                </Text>
              </Pressable>
            )
          )}

          <View className="flex-row items-center" style={{ gap: 8, marginTop: 18 }}>
            <AdjustButton
              label={`−${STEP_MIN}`}
              a11y={`Take off ${STEP_MIN} minutes`}
              disabled={!canAdjust(focus, -STEP_MIN, now)}
              onPress={() => adjustFocus(-STEP_MIN)}
            />

            {/* progress ring */}
            <Animated.View
              style={[{ width: ring, height: ring }, ringDim]}
              accessible
              accessibilityRole="timer"
              accessibilityLabel={
                focus.running
                  ? `${leftMin} ${leftMin === 1 ? 'minute' : 'minutes'} left. ${meta.label}, plus ${livePts} points.`
                  : `Paused with ${leftMin} ${leftMin === 1 ? 'minute' : 'minutes'} left.`
              }
            >
              <Svg width={ring} height={ring} viewBox="0 0 212 212">
                <Circle cx={106} cy={106} r={R} fill="none" stroke={palette.soft} strokeWidth={13} />
                <AnimatedCircle
                  cx={106}
                  cy={106}
                  r={R}
                  fill="none"
                  stroke={palette.accent}
                  strokeWidth={13}
                  strokeLinecap="round"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  animatedProps={ringProps}
                  transform="rotate(-90 106 106)"
                />
              </Svg>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  className="font-mono text-ink"
                  style={{ fontSize: Math.round(46 * ringScale), letterSpacing: -1.5 }}
                  maxFontSizeMultiplier={1.15}
                >
                  {formatClock(focusRemaining)}
                </Text>
                {/* Both directions on purpose: duration-estimation errors run high
                    and low, so remaining alone can't correct a mis-read either way. */}
                <Text
                  className="font-hk600 text-muted text-[11px]"
                  style={{ letterSpacing: 0.5 }}
                  maxFontSizeMultiplier={1.15}
                >
                  {focus.running
                    ? `left · ${formatClock(focus.totalSec - focusRemaining)} focused`
                    : 'PAUSED'}
                </Text>
                <Text
                  className="font-hk700 text-accent text-[12px] mt-1.5"
                  maxFontSizeMultiplier={1.15}
                >
                  {meta.label} · +{livePts} pts
                </Text>
              </View>
            </Animated.View>

            <AdjustButton
              label={`+${STEP_MIN}`}
              a11y={`Add ${STEP_MIN} minutes`}
              disabled={!canAdjust(focus, STEP_MIN, now)}
              onPress={() => adjustFocus(STEP_MIN)}
            />
          </View>
        </ScrollView>

        <View className="flex-row w-full" style={{ gap: 10 }}>
          <PressableScale
            haptic
            onPress={toggleFocusRun}
            className="flex-1 items-center bg-surface border border-soft"
            style={{ borderRadius: 15, paddingVertical: 15 }}
          >
            <Text className="font-hk700 text-ink text-[15px]">
              {focus.running ? 'Pause' : 'Resume'}
            </Text>
          </PressableScale>
          <PressableScale
            haptic
            onPress={() => finishFocus('done')}
            className="flex-1 items-center bg-accent"
            style={{ borderRadius: 15, paddingVertical: 15 }}
            accessibilityLabel={`Done with ${title}`}
          >
            <Text className="font-hk700 text-on-accent text-[15px]">Done</Text>
          </PressableScale>
        </View>
        <Pressable
          onPress={stop}
          hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
          className="mt-3"
          accessibilityRole="button"
        >
          <Text className="font-hk400 text-muted text-[13px]">Stop without saving</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
