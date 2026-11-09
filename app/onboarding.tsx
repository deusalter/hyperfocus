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
        <Text className="font-hk700 text-ink text-[15.5px]">{title}</Text>
        <Text className="font-hk400 text-muted text-[13px] mt-0.5" style={{ lineHeight: 19 }}>
          {body}
        </Text>
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
              <Text className="font-hk600 text-muted text-[13.5px]" maxFontSizeMultiplier={TITLE_SCALE}>
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
                <Sprite pose="wave" level={4} scale={1.1} />
                <Text
                  className="font-hk800 text-ink text-[30px] mt-2.5"
                  maxFontSizeMultiplier={TITLE_SCALE}
                  style={{ letterSpacing: -1 }}
                  accessibilityRole="header"
                >
                  Hyperfocus
                </Text>
                <Text
                  className="font-hk500 text-ink text-center text-[16px] mt-2.5"
                  style={{ lineHeight: 24, maxWidth: 290 }}
                >
                  Race your past self, gently.
                </Text>
                <Text
                  className="font-hk400 text-muted text-center text-[14px] mt-2"
                  style={{ lineHeight: 21, maxWidth: 290 }}
                >
                  Built for ADHD brains. Miss a day and nothing breaks. You just pick up from
                  wherever you are.
                </Text>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ width: '100%', maxWidth: 310 }}>
                <Text
                  className="font-hk800 text-ink text-center text-[24px] mb-6"
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
                  className="font-hk800 text-ink text-center text-[24px]"
                  style={{ letterSpacing: -0.5 }}
                  maxFontSizeMultiplier={TITLE_SCALE}
                  accessibilityRole="header"
                >
                  Set your pace
                </Text>
                <Text className="font-hk400 text-muted text-center text-[13px] mt-1.5" style={{ lineHeight: 19 }}>
                  All optional. You can change anything later.
                </Text>

                <View style={{ marginTop: 22 }}>
                  <Text className="font-hk700 text-muted text-[12px]" style={{ letterSpacing: 0.3 }}>
                    WHAT SHOULD WE CALL YOU?
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                    placeholder="Your name"
                    placeholderTextColor={palette.muted}
                    returnKeyType="done"
                    accessibilityLabel="Your name"
                    className="bg-surface border border-soft font-hk400 text-ink text-[15px]"
                    style={{ marginTop: 7, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13 }}
                  />
                </View>

                <View style={{ marginTop: 18 }}>
                  <Text className="font-hk700 text-muted text-[12px]" style={{ letterSpacing: 0.3 }}>
                    FOCUS SESSION LENGTH
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
                            className="font-hk700 text-[14px]"
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
                    <Text className="font-hk700 text-ink text-[14.5px]">Gentle mode</Text>
                    <Text className="font-hk400 text-muted text-[12.5px] mt-0.5" style={{ lineHeight: 17 }}>
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
              <Text className="font-hk700 text-on-accent text-[15.5px]">
                {step >= STEPS - 1 ? "Let's go" : 'Next'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
