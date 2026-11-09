import { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
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
  interpolateColor,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { ArrowLeft, ArrowRight } from '@/components/ui/Icon'
import Sprite from '@/components/Sprite'
import UndoToast from '@/components/UndoToast'
import { useApp } from '@/store/AppStore'
import { goBackOrHome } from '@/lib/nav'
import { TODAY_CAP } from '@/lib/points'
import { TITLE_SCALE, useColors } from '@/lib/theme'

const COMMIT_DX = 80
/** a flick this fast counts even if it hasn't travelled the distance */
const COMMIT_VELOCITY = 700
const FLY_OUT = 420

function thresholdBuzz() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

export default function TriageScreen() {
  const palette = useColors()
  const { inbox, today, triageAssign, updateTask, level } = useApp()
  const router = useRouter()
  const current = inbox[0]
  const next = inbox[1]
  const full = today.length >= TODAY_CAP

  const dx = useSharedValue(0)
  const crossed = useSharedValue(0)

  // A swipe is quick and easy to get wrong, so the last one can be taken back.
  // Inline rather than a toast: sorting a long list would otherwise flash one at
  // you on every card. Letting go keeps its toast, since that one removes something.
  const [lastSorted, setLastSorted] = useState<{ id: string; title: string } | null>(null)
  const undoLast = () => {
    if (lastSorted) updateTask(lastSorted.id, { bucket: 'inbox' })
    setLastSorted(null)
  }

  // Reset the card position *before* handing the decision to React. Doing it
  // after let the incoming card paint for a frame at the old offset — a
  // visible jump as the next task appeared already flung off-screen.
  const decide = useCallback(
    (id: string, title: string, bucket: 'today' | 'later') => {
      dx.value = 0
      crossed.value = 0
      triageAssign(id, bucket)
      setLastSorted({ id, title })
    },
    [dx, crossed, triageAssign]
  )

  const currentId = current?.id
  const currentTitle = current?.title ?? ''
  // rebuilt only when the card changes — a fresh Gesture object every render
  // makes GestureDetector re-register its handlers on each keystroke
  const pan = useMemo(
    () =>
      Gesture.Pan()
        // horizontal only, so swiping the sheet down to close still works
        .activeOffsetX([-12, 12])
        .failOffsetY([-14, 14])
        .onChange((e) => {
          dx.value += e.changeX
          // haptic tick the instant the swipe becomes a commitment
          const zone = dx.value > COMMIT_DX ? 1 : dx.value < -COMMIT_DX ? -1 : 0
          if (zone !== 0 && zone !== crossed.value) runOnJS(thresholdBuzz)()
          crossed.value = zone
        })
        .onEnd((e) => {
          if (!currentId) return
          if (dx.value > COMMIT_DX || e.velocityX > COMMIT_VELOCITY) {
            dx.value = withTiming(FLY_OUT, { duration: 160 }, () => {
              runOnJS(decide)(currentId, currentTitle, 'today')
            })
          } else if (dx.value < -COMMIT_DX || e.velocityX < -COMMIT_VELOCITY) {
            dx.value = withTiming(-FLY_OUT, { duration: 160 }, () => {
              runOnJS(decide)(currentId, currentTitle, 'later')
            })
          } else {
            // settle back without wobble
            dx.value = withSpring(0, { damping: 28, stiffness: 260 })
          }
        }),
    [dx, crossed, currentId, currentTitle, decide]
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
    // opaque tints: this card sits on top of the next one, which would show
    // through anything translucent
    backgroundColor: interpolateColor(
      dx.value,
      [-COMMIT_DX, 0, COMMIT_DX],
      [palette.soft, palette.surface, palette.accentSoft]
    ),
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
                  className="font-hk700 text-footnote"
                  style={{ color: full ? palette.dangerText : palette.muted }}
                  maxFontSizeMultiplier={1.4}
                >
                  Today {today.length}/{TODAY_CAP}
                </Text>
                <Text className="font-hk600 text-muted text-footnote" maxFontSizeMultiplier={1.4}>
                  {inbox.length} left
                </Text>
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
                className="font-hk600 text-muted text-center text-footnote"
                style={{ paddingHorizontal: 12 }}
              >
                Today already holds {today.length}. Most days fit about {TODAY_CAP}, and Later
                is not a downgrade.
              </Animated.Text>
            )}
            <View
              className="flex-row justify-between"
              style={{ paddingHorizontal: 4 }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Animated.View className="flex-row items-center" style={[{ gap: 5 }, laterHint]}>
                <ArrowLeft size={13} color={palette.muted} />
                <Text className="font-hk700 text-muted text-footnote" maxFontSizeMultiplier={1.4}>
                  Later
                </Text>
              </Animated.View>
              <Animated.View className="flex-row items-center" style={[{ gap: 5 }, todayHint]}>
                <Text className="font-hk700 text-accent text-footnote" maxFontSizeMultiplier={1.4}>
                  Today
                </Text>
                <ArrowRight size={13} color={palette.accent} />
              </Animated.View>
            </View>

            <View>
              {next && (
                <Animated.View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  className="bg-surface border border-soft items-center justify-center"
                  style={[
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      borderRadius: 28,
                      paddingVertical: 36,
                      paddingHorizontal: 26,
                    },
                    nextStyle,
                  ]}
                >
                  <Text
                    className="font-hk700 text-muted text-center text-title2"
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
                      borderRadius: 28,
                      paddingVertical: 36,
                      paddingHorizontal: 26,
                      minHeight: 200,
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
                    className="font-hk800 text-ink text-center text-title2"
                    style={{ letterSpacing: -0.3 }}
                  >
                    {current.title}
                  </Text>
                </Animated.View>
              </GestureDetector>
            </View>

            <View className="flex-row" style={{ gap: 10 }}>
              <PressableScale
                haptic
                onPress={() => decide(current.id, current.title, 'later')}
                className="flex-1 items-center bg-surface border border-soft"
                style={{ borderRadius: 18, paddingVertical: 16 }}
              >
                <Text className="font-hk700 text-ink text-subhead" maxFontSizeMultiplier={TITLE_SCALE}>
                  Later
                </Text>
              </PressableScale>
              <PressableScale
                haptic
                onPress={() => {
                  setLastSorted(null)
                  triageAssign(current.id, 'drop')
                }}
                className="items-center"
                style={{
                  borderRadius: 18,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: palette.muted,
                }}
              >
                <Text className="font-hk600 text-muted text-subhead" maxFontSizeMultiplier={TITLE_SCALE}>
                  Let go
                </Text>
              </PressableScale>
              <PressableScale
                haptic
                onPress={() => decide(current.id, current.title, 'today')}
                className="flex-1 items-center bg-accent"
                style={{ borderRadius: 18, paddingVertical: 16 }}
              >
                <Text className="font-hk700 text-on-accent text-subhead" maxFontSizeMultiplier={TITLE_SCALE}>
                  Today
                </Text>
              </PressableScale>
            </View>
            <View style={{ minHeight: 20 }}>
              {lastSorted && (
                <Pressable
                  onPress={undoLast}
                  hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                  className="self-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Undo sorting ${lastSorted.title}`}
                >
                  <Text className="font-hk600 text-muted text-footnote" numberOfLines={1}>
                    Undo last
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-1 items-center justify-center"
            style={{ gap: 6 }}
          >
            <Sprite pose="cheer" level={level} />
            <Text className="font-hk800 text-ink text-title2" style={{ marginTop: 4 }}>
              All sorted.
            </Text>
            <Text
              className="font-hk400 text-muted text-subhead text-center"
              style={{ maxWidth: 270 }}
            >
              Nothing left to sort. Pick something from Today when you&apos;re ready.
            </Text>
            <PressableScale
              haptic
              onPress={() => goBackOrHome(router)}
              className="bg-accent"
              style={{ borderRadius: 18, paddingVertical: 15, paddingHorizontal: 30, marginTop: 16 }}
            >
              <Text className="font-hk700 text-on-accent text-headline">Go to Today</Text>
            </PressableScale>
            {lastSorted && (
              <Pressable
                onPress={undoLast}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                className="mt-4"
                accessibilityRole="button"
                accessibilityLabel={`Undo sorting ${lastSorted.title}`}
              >
                <Text className="font-hk600 text-muted text-footnote">Undo last</Text>
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>
      <UndoToast />
    </SafeAreaView>
  )
}
