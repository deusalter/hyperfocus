import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'

export default function RecapScreen() {
  const router = useRouter()
  const { lastRecap, todayTotals, baseline, ahead, level } = useApp()

  const goHome = () => router.replace('/')

  // nothing to celebrate — bounce home
  useEffect(() => {
    if (!lastRecap) router.replace('/')
  }, [lastRecap, router])

  if (!lastRecap) return <View className="flex-1 bg-background" />

  const pastPts = baseline?.totals.points ?? 0
  const gap = Math.max(0, pastPts - todayTotals.points)
  const title = ahead ? 'New best — past yesterday!' : 'Nice work.'
  const msg = ahead
    ? 'You’ve passed yesterday’s self. Your companion is thriving.'
    : baseline
      ? `Just ${gap} pts from yesterday — one step at a time.`
      : 'First points on the board. Tomorrow races against today.'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {ahead && <Confetti fall={420} />}
      <View className="flex-1 items-center justify-center" style={{ padding: 20 }}>
        <Animated.Text
          entering={FadeIn.duration(300)}
          className="font-hk800 text-accent text-[11px]"
          style={{ letterSpacing: 1.5 }}
        >
          SESSION COMPLETE
        </Animated.Text>

        <Animated.View entering={ZoomIn.springify().damping(12).delay(120)} className="mt-2.5">
          <Sprite pose="cheer" level={Math.max(level, 1)} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(200).duration(300)}
          className="font-hk800 text-ink text-[23px] mt-1"
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(280).duration(300)}
          className="font-hk400 text-muted text-center text-[13.5px] mt-2"
          style={{ maxWidth: 250, lineHeight: 20 }}
        >
          {msg}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(360).duration(300)}
          className="flex-row mt-5 w-full"
          style={{ gap: 10 }}
        >
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, padding: 14 }}>
            <Text className="font-mono text-accent text-[24px]" style={{ letterSpacing: -0.5 }}>
              +{lastRecap.points}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">PTS THIS SESSION</Text>
          </View>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, padding: 14 }}>
            <Text className="font-mono text-ink text-[24px]" style={{ letterSpacing: -0.5 }}>
              {todayTotals.points}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">MOMENTUM TODAY</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(440).duration(300)} className="w-full">
          <PressableScale
            haptic
            onPress={goHome}
            className="bg-accent items-center mt-6 w-full"
            style={{ borderRadius: 16, paddingVertical: 16 }}
          >
            <Text className="font-hk700 text-white text-[15px]">Back home</Text>
          </PressableScale>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
