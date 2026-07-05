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
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import Sprite from '@/components/Sprite'
import { useApp } from '@/store/AppStore'
import { palette, hexA } from '@/lib/theme'

const COMMIT_DX = 80
const FLY_OUT = 420

export default function TriageScreen() {
  const { inbox, triageAssign, level } = useApp()
  const router = useRouter()
  const current = inbox[0]

  const dx = useSharedValue(0)

  const decide = (bucket: 'today' | 'later') => {
    if (!current) return
    triageAssign(current.id, bucket)
    dx.value = 0
  }

  const pan = Gesture.Pan()
    .onChange((e) => {
      dx.value += e.changeX
    })
    .onEnd(() => {
      if (dx.value > COMMIT_DX) {
        dx.value = withTiming(FLY_OUT, { duration: 160 }, () => {
          runOnJS(decide)('today')
        })
      } else if (dx.value < -COMMIT_DX) {
        dx.value = withTiming(-FLY_OUT, { duration: 160 }, () => {
          runOnJS(decide)('later')
        })
      } else {
        dx.value = withSpring(0, { damping: 16, stiffness: 220 })
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
              <Text className="font-hk600 text-muted text-[12px]">{inbox.length} left</Text>
            ) : undefined
          }
        />

        {current ? (
          <View className="flex-1 justify-center" style={{ gap: 18, paddingVertical: 8 }}>
            <View className="flex-row justify-between" style={{ paddingHorizontal: 4 }}>
              <Animated.Text className="font-hk700 text-muted text-[11px]" style={laterHint}>
                ← LATER
              </Animated.Text>
              <Animated.Text className="font-hk700 text-accent text-[11px]" style={todayHint}>
                TODAY →
              </Animated.Text>
            </View>

            <GestureDetector gesture={pan}>
              <Animated.View
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

            <View className="flex-row" style={{ gap: 9 }}>
              <PressableScale
                haptic
                onPress={() => decide('later')}
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
                onPress={() => decide('today')}
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
