import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import Sprite from '@/components/Sprite'
import Toggle from '@/components/ui/Toggle'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { FOCUS_OPTIONS } from '@/lib/session'
import { TITLE_SCALE, useColors } from '@/lib/theme'

const STEPS = 3

function StepIcon({ kind }: { kind: 'dump' | 'start' | 'grow' }) {
  const palette = useColors()
  const stroke = { stroke: palette.accent, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  return (
    <View
      className="bg-accent-soft items-center justify-center"
      style={{ width: 40, height: 40, borderRadius: 13 }}
    >
      {kind === 'dump' && (
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...stroke} />
        </Svg>
      )}
      {kind === 'start' && (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d="M8 5v14l11-7z" fill={palette.accent} />
        </Svg>
      )}
      {kind === 'grow' && (
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M3 17l5-5 4 4 8-8M16 8h4v4" {...stroke} />
        </Svg>
      )}
    </View>
  )
}

function HowItem({ kind, title, body }: { kind: 'dump' | 'start' | 'grow'; title: string; body: string }) {
  return (
    <View className="flex-row items-start" style={{ gap: 14 }} accessible>
      <StepIcon kind={kind} />
      <View className="flex-1">
        <Text className="font-hk700 text-ink text-headline">{title}</Text>
        <Text className="font-hk400 text-muted text-subhead mt-0.5">
          {body}
        </Text>
      </View>
    </View>
  )
}

const SCENE_W = 300
const SCENE_H = 124
const LANE_TOP = 94
const LANE_H = 10
/** a sprite's feet sit this far down its box, so it can stand on the lane */
const FEET = 0.85
const RUNNER_AT = 0.6
const GHOSTS = [0.16, 0.38, 0.84]

/**
 * The idea in one picture, before any words: you on a lane, ahead of some of
 * your past days and behind one. It's the same lane Home shows, so the first
 * screen after this already looks familiar.
 */
function RaceScene() {
  const palette = useColors()
  const ghostScale = 0.58
  const runnerScale = 0.82
  return (
    <View
      style={{ width: SCENE_W, height: SCENE_H }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: LANE_TOP,
          height: LANE_H,
          borderRadius: LANE_H / 2,
          backgroundColor: palette.soft,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: SCENE_W * RUNNER_AT,
          top: LANE_TOP,
          height: LANE_H,
          borderRadius: LANE_H / 2,
          backgroundColor: palette.accent,
        }}
      />
      {GHOSTS.map((at) => (
        <View key={at}>
          <View
            style={{
              position: 'absolute',
              left: SCENE_W * at - 3,
              top: LANE_TOP + (LANE_H - 6) / 2,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: at < RUNNER_AT ? palette.onAccent : palette.muted,
              opacity: at < RUNNER_AT ? 1 : 0.55,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: SCENE_W * at - (130 * ghostScale) / 2,
              top: LANE_TOP + 2 - 140 * ghostScale * FEET,
            }}
          >
            <Sprite ghost level={3} scale={ghostScale} />
          </View>
        </View>
      ))}
      <View
        style={{
          position: 'absolute',
          left: SCENE_W * RUNNER_AT - (130 * runnerScale) / 2,
          top: LANE_TOP + 3 - 140 * runnerScale * FEET,
        }}
      >
        {/* mid-stride and still: a picture, not a loop */}
        <Sprite pose="run" calm level={4} scale={runnerScale} />
      </View>
    </View>
  )
}

export default function OnboardingScreen() {
  const palette = useColors()
  const router = useRouter()
  const { settings, updateSettings } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(settings.name)
  const [focusLen, setFocusLen] = useState(settings.focusLen)
  const [gentle, setGentle] = useState(settings.gentle)

  const finish = () => {
    updateSettings({ name: name.trim(), focusLen, gentle, onboarded: true })
    router.dismissTo('/')
  }

  const next = () => (step >= STEPS - 1 ? finish() : setStep(step + 1))

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1" style={{ paddingHorizontal: 26, paddingTop: 8, paddingBottom: 24 }}>
          {/* grows with the text rather than clipping Skip at the largest sizes */}
          <View className="flex-row justify-end" style={{ minHeight: 24 }}>
            <Pressable onPress={finish} hitSlop={14} accessibilityRole="button" accessibilityLabel="Skip the introduction">
              <Text className="font-hk600 text-muted text-subhead" maxFontSizeMultiplier={TITLE_SCALE}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* scrolls rather than clips: step three plus a keyboard is taller than
              an iPhone SE has room for */}
          <ScrollView
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 0 && (
              <Animated.View entering={FadeInUp.duration(400)} className="items-center">
                <RaceScene />
                <Text
                  className="font-hk800 text-ink text-[34px]"
                  maxFontSizeMultiplier={TITLE_SCALE}
                  style={{ letterSpacing: -1, marginTop: 22 }}
                  accessibilityRole="header"
                >
                  Hyperfocus
                </Text>
                <Text
                  className="font-hk600 text-ink text-center text-title3 mt-2"
                  style={{ maxWidth: 300 }}
                >
                  Race your past self, gently.
                </Text>
                <Text
                  className="font-hk400 text-muted text-center text-subhead mt-3"
                  style={{ lineHeight: 22, maxWidth: 300 }}
                >
                  Built for ADHD brains. Miss a day and nothing breaks. You just pick up from
                  wherever you are.
                </Text>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ width: '100%', maxWidth: 310 }}>
                <Text
                  className="font-hk800 text-ink text-center text-title1 mb-6"
                  maxFontSizeMultiplier={TITLE_SCALE}
                  style={{ letterSpacing: -0.5 }}
                  accessibilityRole="header"
                >
                  How it works
                </Text>
                <View style={{ gap: 18 }}>
                  <HowItem
                    kind="dump"
                    title="Dump it"
                    body="Empty your head in seconds. Sort it later."
                  />
                  <HowItem
                    kind="start"
                    title="Start one thing"
                    body="We pick the task so you don't have to. One tap to begin."
                  />
                  <HowItem
                    kind="grow"
                    title="Pass your recent days"
                    body="Everything you finish moves your runner past more of them. Starting counts as much as the minutes."
                  />
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ width: '100%', maxWidth: 310 }}>
                <Text
                  className="font-hk800 text-ink text-center text-title1"
                  style={{ letterSpacing: -0.5 }}
                  maxFontSizeMultiplier={TITLE_SCALE}
                  accessibilityRole="header"
                >
                  Set your pace
                </Text>
                <Text className="font-hk400 text-muted text-center text-subhead mt-1.5">
                  All optional. You can change anything later.
                </Text>

                <View style={{ marginTop: 22 }}>
                  <Text className="font-hk700 text-muted text-footnote">
                    What should we call you?
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                    placeholder="Your name"
                    placeholderTextColor={palette.muted}
                    returnKeyType="done"
                    accessibilityLabel="Your name"
                    className="bg-surface border border-soft font-hk400 text-ink text-body"
                    style={{ marginTop: 7, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13 }}
                  />
                </View>

                <View style={{ marginTop: 18 }}>
                  <Text className="font-hk700 text-muted text-footnote">
                    Focus session length
                  </Text>
                  <View className="flex-row" style={{ gap: 8, marginTop: 7 }} accessibilityRole="radiogroup">
                    {FOCUS_OPTIONS.map((n) => {
                      const active = focusLen === n
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setFocusLen(n)}
                          className="flex-1 items-center"
                          style={{
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: active ? palette.accent : palette.soft,
                            backgroundColor: active ? palette.accent : palette.surface,
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active, checked: active }}
                          accessibilityLabel={`${n} minutes`}
                        >
                          <Text
                            className="font-hk700 text-subhead"
                            style={{ color: active ? palette.onAccent : palette.ink }}
                          >
                            {n}m
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={() => setGentle((v) => !v)}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ gap: 12, marginTop: 18, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 }}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: gentle }}
                >
                  <View className="flex-1">
                    <Text className="font-hk700 text-ink text-body">Gentle mode</Text>
                    <Text className="font-hk400 text-muted text-footnote mt-0.5">
                      No comparisons. Hides the race field and day counts.
                    </Text>
                  </View>
                  <Toggle on={gentle} />
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>

          <View>
            <View
              className="flex-row justify-center"
              style={{ gap: 7, marginBottom: 18 }}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Step ${step + 1} of ${STEPS}`}
            >
              {Array.from({ length: STEPS }, (_, i) => (
                <View
                  key={i}
                  style={{
                    width: step === i ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: step === i ? palette.accent : palette.soft,
                  }}
                />
              ))}
            </View>
            <PressableScale
              haptic
              onPress={next}
              className="bg-accent items-center"
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                shadowColor: palette.accent,
                shadowOpacity: 0.32,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <Text className="font-hk700 text-on-accent text-headline">
                {step >= STEPS - 1 ? "Let's go" : 'Next'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
