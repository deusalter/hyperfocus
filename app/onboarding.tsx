import { useState } from 'react'
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import Sprite from '@/components/Sprite'
import Toggle from '@/components/ui/Toggle'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

const FOCUS_OPTIONS = [15, 25, 45]

function StepIcon({ kind }: { kind: 'dump' | 'start' | 'grow' }) {
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

export default function OnboardingScreen() {
  const router = useRouter()
  const { settings, updateSettings } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(settings.name)
  const [focusLen, setFocusLen] = useState(settings.focusLen)
  const [gentle, setGentle] = useState(settings.gentle)

  const finish = () => {
    updateSettings({ name: name.trim(), focusLen, gentle, onboarded: true })
    router.replace('/')
  }

  const next = () => (step >= 2 ? finish() : setStep(step + 1))

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1" style={{ paddingHorizontal: 26, paddingTop: 8, paddingBottom: 30 }}>
          <View className="flex-row justify-end" style={{ height: 24 }}>
            <Pressable onPress={finish} hitSlop={10}>
              <Text className="font-hk600 text-muted text-[13px]">Skip</Text>
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center">
            {step === 0 && (
              <Animated.View entering={FadeInUp.duration(400)} className="items-center">
                <Sprite pose="wave" level={4} scale={1.1} />
                <Text className="font-hk800 text-ink text-[30px] mt-2.5" style={{ letterSpacing: -1 }}>
                  Hyperfocus
                </Text>
                <Text
                  className="font-hk500 text-ink text-center text-[16px] mt-2.5"
                  style={{ lineHeight: 24, maxWidth: 280 }}
                >
                  Grow past yesterday — gently.
                </Text>
                <Text
                  className="font-hk400 text-muted text-center text-[13.5px] mt-2"
                  style={{ lineHeight: 21, maxWidth: 280 }}
                >
                  A focus companion built for ADHD brains. No streaks to break, no shame — just you,
                  a little further along than yesterday.
                </Text>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ width: '100%', maxWidth: 300 }}>
                <Text
                  className="font-hk800 text-ink text-center text-[24px] mb-6"
                  style={{ letterSpacing: -0.5 }}
                >
                  How it works
                </Text>
                <View style={{ gap: 18 }}>
                  <View className="flex-row items-start" style={{ gap: 14 }}>
                    <StepIcon kind="dump" />
                    <View className="flex-1">
                      <Text className="font-hk700 text-ink text-[15.5px]">Dump it</Text>
                      <Text className="font-hk400 text-muted text-[13px] mt-0.5" style={{ lineHeight: 19 }}>
                        Empty your head in seconds. Sort it later.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start" style={{ gap: 14 }}>
                    <StepIcon kind="start" />
                    <View className="flex-1">
                      <Text className="font-hk700 text-ink text-[15.5px]">Start one thing</Text>
                      <Text className="font-hk400 text-muted text-[13px] mt-0.5" style={{ lineHeight: 19 }}>
                        We pick the task so you don&apos;t have to. One tap to begin.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start" style={{ gap: 14 }}>
                    <StepIcon kind="grow" />
                    <View className="flex-1">
                      <Text className="font-hk700 text-ink text-[15.5px]">Watch yourself grow</Text>
                      <Text className="font-hk400 text-muted text-[13px] mt-0.5" style={{ lineHeight: 19 }}>
                        Every minute moves your companion past who you were yesterday.
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ width: '100%', maxWidth: 300 }}>
                <Text
                  className="font-hk800 text-ink text-center text-[24px]"
                  style={{ letterSpacing: -0.5 }}
                >
                  Set your pace
                </Text>
                <Text className="font-hk400 text-muted text-center text-[13px] mt-1.5" style={{ lineHeight: 19 }}>
                  All optional. Change anything later.
                </Text>

                <View style={{ marginTop: 22 }}>
                  <Text className="font-hk700 text-muted text-[12px]" style={{ letterSpacing: 0.3 }}>
                    WHAT SHOULD WE CALL YOU?
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={palette.muted}
                    className="bg-surface border border-soft font-hk400 text-ink text-[15px]"
                    style={{ marginTop: 7, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13 }}
                  />
                </View>

                <View style={{ marginTop: 18 }}>
                  <Text className="font-hk700 text-muted text-[12px]" style={{ letterSpacing: 0.3 }}>
                    DEFAULT FOCUS LENGTH
                  </Text>
                  <View className="flex-row" style={{ gap: 8, marginTop: 7 }}>
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
                        >
                          <Text
                            className="font-hk700 text-[14px]"
                            style={{ color: active ? '#fff' : palette.ink }}
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
                >
                  <View className="flex-1">
                    <Text className="font-hk700 text-ink text-[14.5px]">Gentle mode</Text>
                    <Text className="font-hk400 text-muted text-[12px] mt-0.5" style={{ lineHeight: 17 }}>
                      Hide streak pressure. Kinder nudges only.
                    </Text>
                  </View>
                  <Toggle on={gentle} />
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View>
            <View className="flex-row justify-center" style={{ gap: 7, marginBottom: 18 }}>
              {[0, 1, 2].map((i) => (
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
              <Text className="font-hk700 text-white text-[15.5px]">
                {step >= 2 ? "Let's go" : 'Next'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
