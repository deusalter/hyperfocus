import { useCallback, useMemo } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import Sprite from '@/components/Sprite'
import { useApp } from '@/store/AppStore'
import { TODAY_CAP } from '@/lib/points'
import { palette, hexA } from '@/lib/theme'

const COMMIT_DX = 80
const FLY_OUT = 420

function thresholdBuzz() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

export default function TriageScreen() {
  const { inbox, today, triageAssign, level } = useApp()
  const router = useRouter()
  const current = inbox[0]
  const next = inbox[1]
  const full = today.length >= TODAY_CAP

  const dx = useSharedValue(0)
  const crossed = useSharedValue(0)

  // Reset the card position *before* handing the decision to React. Doing it
  // after let the incoming card paint for a frame at the old offset — a
  // visible jump as the next task appeared already flung off-screen.
  const decide = useCallback(
    (id: string, bucket: 'today' | 'later') => {
      dx.value = 0
      crossed.value = 0
      triageAssign(id, bucket)
    },
    [dx, crossed, triageAssign]
  )

  const currentId = current?.id
  // rebuilt only when the card changes — a fresh Gesture object every render
  // makes GestureDetector re-register its handlers on each keystroke
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onChange((e) => {
          dx.value += e.changeX
          // haptic tick the instant the swipe becomes a commitment
          const zone = dx.value > COMMIT_DX ? 1 : dx.value < -COMMIT_DX ? -1 : 0
          if (zone !== 0 && zone !== crossed.value) runOnJS(thresholdBuzz)()
          crossed.value = zone
        })
        .onEnd(() => {
          if (!currentId) return
          if (dx.value > COMMIT_DX) {
            dx.value = withTiming(FLY_OUT, { duration: 160 }, () => {
              runOnJS(decide)(currentId, 'today')
            })
          } else if (dx.value < -COMMIT_DX) {
            dx.value = withTiming(-FLY_OUT, { duration: 160 }, () => {
              runOnJS(decide)(currentId, 'later')
            })
          } else {
            // settle back without wobble
            dx.value = withSpring(0, { damping: 28, stiffness: 260 })
          }
        }),
    [dx, crossed, currentId, decide]
  )

  // the card behind rises into place as the front card leaves
  const nextStyle = useAnimatedStyle(() => {
    const commit = Math.min(1, Math.abs(dx.value) / (COMMIT_DX * 2))
    return {
      transform: [{ scale: 0.94 + 0.06 * commit }, { translateY: 10 - 10 * commit }],
      opacity: 0.55 + 0.45 * commit,
    }
  })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }, { rotate: `${dx.value * 0.03}deg` }],
    backgroundColor:
      dx.value > 30
        ? hexA(palette.accent, Math.min(0.12, (dx.value - 30) / 400))
        : palette.surface,
  }))
  const todayHint = useAnimatedStyle(() => ({
    opacity: interpolate(dx.value, [20, COMMIT_DX], [0.4, 1], 'clamp'),
  }))
  const laterHint = useAnimatedStyle(() => ({
    opacity: interpolate(dx.value, [-COMMIT_DX, -20], [1, 0.4], 'clamp'),
  }))

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1" style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
        <ScreenHeader
          title="Triage"
          right={
            inbox.length > 0 ? (
              <View className="flex-row items-center" style={{ gap: 10 }}>
                {/* capacity is visible while deciding, not after — this is the
                    moment the choice is actually being made */}
                <Text
                  className="font-hk700 text-[12px]"
                  style={{ color: full ? palette.dangerText : palette.muted }}
                >
                  Today {today.length}/{TODAY_CAP}
                </Text>
                <Text className="font-hk600 text-muted text-[12px]">{inbox.length} left</Text>
              </View>
            ) : undefined
          }
        />

        {current ? (
          <View className="flex-1 justify-center" style={{ gap: 18, paddingVertical: 8 }}>
            {/* A note, not a block. The cap exists to stop Today rebuilding the
                pile you just cleared, but overruling a decision made one second
                ago would be the more annoying failure. */}
            {full && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                className="font-hk600 text-muted text-center text-[12px]"
                style={{ lineHeight: 17, paddingHorizontal: 12 }}
              >
                Today already holds {today.length}. Most days fit about {TODAY_CAP} —
                Later is not a downgrade.
              </Animated.Text>
            )}
            <View className="flex-row justify-between" style={{ paddingHorizontal: 4 }}>
              <Animated.Text className="font-hk700 text-muted text-[11px]" style={laterHint}>
                ← LATER
              </Animated.Text>
              <Animated.Text className="font-hk700 text-accent text-[11px]" style={todayHint}>
                TODAY →
              </Animated.Text>
            </View>

            <View>
              {next && (
                <Animated.View
                  pointerEvents="none"
                  className="bg-surface border border-soft items-center justify-center"
                  style={[
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      borderRadius: 22,
                      paddingVertical: 30,
                      paddingHorizontal: 24,
                    },
                    nextStyle,
                  ]}
                >
                  <Text
                    className="font-hk600 text-muted text-center text-[20px]"
                    style={{ lineHeight: 28 }}
                    numberOfLines={2}
                  >
                    {next.title}
                  </Text>
                </Animated.View>
              )}
              <GestureDetector gesture={pan}>
                <Animated.View
                  key={current.id}
                  entering={FadeIn.duration(140)}
                  className="border border-soft items-center justify-center"
                  style={[
                    {
                      borderRadius: 22,
                      paddingVertical: 30,
                      paddingHorizontal: 24,
                      minHeight: 140,
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 4,
                    },
                    cardStyle,
                  ]}
                >
                  <Text
                    className="font-hk600 text-ink text-center text-[20px]"
                    style={{ lineHeight: 28 }}
                  >
                    {current.title}
                  </Text>
                </Animated.View>
              </GestureDetector>
            </View>

            <View className="flex-row" style={{ gap: 9 }}>
              <PressableScale
                haptic
                onPress={() => decide(current.id, 'later')}
                className="flex-1 items-center bg-surface border border-soft"
                style={{ borderRadius: 14, paddingVertical: 14 }}
              >
                <Text className="font-hk700 text-ink text-[13.5px]">Later</Text>
              </PressableScale>
              <PressableScale
                haptic
                onPress={() => triageAssign(current.id, 'drop')}
                className="items-center"
                style={{
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: palette.soft,
                }}
              >
                <Text className="font-hk600 text-muted text-[13.5px]">Let go</Text>
              </PressableScale>
              <PressableScale
                haptic
                onPress={() => decide(current.id, 'today')}
                className="flex-1 items-center bg-accent"
                style={{ borderRadius: 14, paddingVertical: 14 }}
              >
                <Text className="font-hk700 text-white text-[13.5px]">Today</Text>
              </PressableScale>
            </View>
          </View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-1 items-center justify-center"
            style={{ gap: 6 }}
          >
            <Sprite pose="cheer" level={level} />
            <Text className="font-hk800 text-ink text-[19px] mt-1">All sorted.</Text>
            <Text
              className="font-hk400 text-muted text-[13px] text-center"
              style={{ maxWidth: 220, lineHeight: 20 }}
            >
              Nothing left in your head. Pick something from Today and focus.
            </Text>
            <PressableScale
              haptic
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="bg-accent mt-3.5"
              style={{ borderRadius: 14, paddingVertical: 13, paddingHorizontal: 26 }}
            >
              <Text className="font-hk700 text-white text-[14px]">Go to Today</Text>
            </PressableScale>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  )
}
