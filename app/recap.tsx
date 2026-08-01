import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'

/** Counts 0 → target with an ease-out curve — makes the points feel earned. */
function useCountUp(target: number, duration = 700, delay = 380) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const timer = setTimeout(() => {
      const tick = (t: number) => {
        if (start == null) start = t
        const p = Math.min(1, (t - start) / duration)
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])
  return value
}

export default function RecapScreen() {
  const router = useRouter()
  const { lastRecap, todayTotals, race, ahead, level } = useApp()

  const goHome = () => router.replace('/')

  const sessionPts = useCountUp(lastRecap?.points ?? 0)
  const momentumPts = useCountUp(todayTotals.points, 700, 500)

  // nothing to celebrate — bounce home
  useEffect(() => {
    if (!lastRecap) router.replace('/')
  }, [lastRecap, router])

  if (!lastRecap) return <View className="flex-1 bg-background" />

  const gap = Math.max(0, race.pacer - todayTotals.points)
  const title = ahead ? 'Past a typical day.' : 'That counted.'
  const msg = ahead
    ? `${race.passed} of your last ${race.ghosts.length} days are behind you now.`
    : race.hasField
      ? race.passed > 0
        ? `${race.passed} days passed — ${gap} pts to typical.`
        : `${gap} pts to a typical day. No hurry.`
      : 'First points on the board. Tomorrow has something to race.'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {ahead && <Confetti fall={420} />}
      <View className="flex-1 items-center justify-center" style={{ padding: 20 }}>
        <Animated.Text
          entering={FadeIn.duration(240)}
          className="font-hk800 text-accent text-[11px]"
          style={{ letterSpacing: 1.5 }}
        >
          SESSION COMPLETE
        </Animated.Text>

        <Animated.View entering={ZoomIn.duration(260).delay(80)} className="mt-2.5">
          <Sprite pose="cheer" level={Math.max(level, 1)} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(140).duration(240)}
          className="font-hk800 text-ink text-[23px] mt-1"
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(190).duration(240)}
          className="font-hk400 text-muted text-center text-[13.5px] mt-2"
          style={{ maxWidth: 250, lineHeight: 20 }}
        >
          {msg}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(240).duration(240)}
          className="flex-row mt-5 w-full"
          style={{ gap: 10 }}
        >
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, padding: 14 }}>
            <Text className="font-mono text-accent text-[24px]" style={{ letterSpacing: -0.5 }}>
              +{sessionPts}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">PTS THIS SESSION</Text>
          </View>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, padding: 14 }}>
            <Text className="font-mono text-ink text-[24px]" style={{ letterSpacing: -0.5 }}>
              {momentumPts}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">MOMENTUM TODAY</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(290).duration(240)} className="w-full">
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
