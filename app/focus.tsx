import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { CATS, palette } from '@/lib/theme'
import { formatClock, scoreCompletion } from '@/lib/points'

const R = 94
const CIRCUMFERENCE = 2 * Math.PI * R

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function FocusScreen() {
  const router = useRouter()
  const {
    focus,
    focusRemaining,
    focusTask,
    lastRecap,
    toggleFocusRun,
    finishFocus,
    abandonFocus,
    setFirstStep,
  } = useApp()
  const [stepDraft, setStepDraft] = useState('')
  const [showStepInput, setShowStepInput] = useState(false)

  const progress = useSharedValue(0)

  useEffect(() => {
    if (!focus) return
    const p = (focus.totalSec - focusRemaining) / focus.totalSec
    progress.value = withTiming(p, { duration: 900, easing: Easing.linear })
  }, [focus, focusRemaining, progress])

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }))

  // session ended (timer hit zero or finished elsewhere) → recap
  useEffect(() => {
    if (!focus && lastRecap) router.replace('/recap')
    else if (!focus && !lastRecap) router.replace('/')
  }, [focus, lastRecap, router])

  if (!focus) return <View className="flex-1 bg-background" />

  const cat = focusTask?.cat ?? 'sprint'
  const meta = CATS[cat]
  const elapsedMin = Math.round((focus.totalSec - focusRemaining) / 60)
  const livePts = scoreCompletion(cat, elapsedMin)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 items-center" style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
        <View className="self-stretch">
          <ScreenHeader title="Focus" onBack={abandonFocus} />
        </View>

        <Text className="font-hk600 text-muted text-[11px] mt-3.5" style={{ letterSpacing: 0.4 }}>
          FOCUSING ON
        </Text>
        <Text
          className="font-hk700 text-ink text-center text-[17px] mt-1"
          style={{ lineHeight: 22, paddingHorizontal: 10 }}
        >
          {focusTask?.title ?? 'One thing'}
        </Text>

        {focusTask?.firstStep ? (
          <View
            className="bg-accent-soft rounded-full mt-2"
            style={{ paddingHorizontal: 13, paddingVertical: 7, maxWidth: 260 }}
          >
            <Text className="font-hk600 text-accent text-center text-[12.5px]" style={{ lineHeight: 17 }}>
              First step: {focusTask.firstStep}
            </Text>
          </View>
        ) : showStepInput ? (
          <View className="flex-row mt-2" style={{ gap: 7, width: '100%', maxWidth: 280 }}>
            <TextInput
              value={stepDraft}
              onChangeText={setStepDraft}
              onSubmitEditing={() => {
                if (focusTask && stepDraft.trim()) setFirstStep(focusTask.id, stepDraft)
                setShowStepInput(false)
              }}
              autoFocus
              placeholder="Smallest first step…"
              placeholderTextColor={palette.muted}
              className="flex-1 bg-surface border border-soft font-hk400 text-ink text-[13px]"
              style={{ borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9 }}
            />
            <PressableScale
              onPress={() => {
                if (focusTask && stepDraft.trim()) setFirstStep(focusTask.id, stepDraft)
                setShowStepInput(false)
              }}
              className="bg-accent items-center justify-center"
              style={{ borderRadius: 11, paddingHorizontal: 14 }}
            >
              <Text className="font-hk700 text-white text-[13px]">Set</Text>
            </PressableScale>
          </View>
        ) : (
          focusTask && (
            <Pressable onPress={() => setShowStepInput(true)} hitSlop={8} className="mt-2">
              <Text className="font-hk700 text-accent text-[12.5px]">
                Feeling stuck? Break it into a first step
              </Text>
            </Pressable>
          )
        )}

        {/* progress ring */}
        <View style={{ width: 212, height: 212, marginTop: 18 }}>
          <Svg width={212} height={212} viewBox="0 0 212 212">
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
            <Text className="font-mono text-ink" style={{ fontSize: 46, letterSpacing: -1.5 }}>
              {formatClock(focusRemaining)}
            </Text>
            <Text
              className="font-hk600 text-muted text-[11px]"
              style={{ letterSpacing: 1, textTransform: 'uppercase' }}
            >
              {focus.running ? 'focusing' : 'paused'}
            </Text>
            <Text className="font-hk700 text-accent text-[12px] mt-1.5">
              {meta.label} · +{livePts} pts
            </Text>
          </View>
        </View>

        <View className="flex-row mt-auto w-full" style={{ gap: 10 }}>
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
            onPress={() => finishFocus()}
            className="flex-1 items-center bg-accent"
            style={{ borderRadius: 15, paddingVertical: 15 }}
          >
            <Text className="font-hk700 text-white text-[15px]">Done</Text>
          </PressableScale>
        </View>
        <Pressable onPress={abandonFocus} hitSlop={8} className="mt-3">
          <Text className="font-hk400 text-muted text-[12.5px]">Stop without saving</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
