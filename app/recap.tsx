import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { scoreParts } from '@/lib/points'
import { spoken } from '@/lib/speech'
import { TITLE_SCALE } from '@/lib/theme'

/** Finished things logged before asking for a review. Enough to have an opinion. */
const REVIEW_AFTER = 5

/** Counts 0 → target with an ease-out curve — makes the points feel earned. */
function useCountUp(target: number, duration = 700, delay = 380) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? target : 0)
  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
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
  }, [target, duration, delay, reduced])
  return value
}

export default function RecapScreen() {
  const router = useRouter()
  const {
    lastRecap,
    todayTotals,
    race,
    ahead,
    level,
    settings,
    history,
    tasks,
    acknowledgeRecap,
    putBackRecapTask,
    finishRecapTask,
    startFocus,
    updateSettings,
  } = useApp()

  // Set before anything that clears the recap, so the bounce below doesn't race
  // an exit already in progress and send "another round" home instead.
  const leaving = useRef(false)

  useEffect(() => {
    acknowledgeRecap()
  }, [acknowledgeRecap])

  const sessionPts = useCountUp(lastRecap?.points ?? 0)
  const momentumPts = useCountUp(todayTotals.points, 700, 500)
  const parts = scoreParts(lastRecap?.cat ?? 'sprint', lastRecap?.minutes ?? 0)

  // nothing to celebrate — bounce home
  useEffect(() => {
    if (!lastRecap && !leaving.current) router.dismissTo('/')
  }, [lastRecap, router])

  if (!lastRecap) return <View className="flex-1 bg-background" />

  const goHome = () => {
    leaving.current = true
    // Asked at most once, on the way out of a good moment rather than on top of it.
    if (!settings.reviewAsked && ahead && history.length >= REVIEW_AFTER) {
      updateSettings({ reviewAsked: true })
      StoreReview.isAvailableAsync()
        .then((ok) => (ok ? StoreReview.requestReview() : undefined))
        .catch(() => {})
    }
    router.dismissTo('/')
  }

  const finished = () => {
    finishRecapTask()
    goHome()
  }

  const putBack = () => {
    putBackRecapTask()
    goHome()
  }

  const anotherRound = () => {
    leaving.current = true
    startFocus(lastRecap.taskId)
    router.replace('/focus')
  }

  const expired = lastRecap.ended === 'expired'
  const taskStillThere = tasks.some((t) => t.id === lastRecap.taskId)
  const showRace = !settings.gentle
  const celebrate = showRace && ahead

  const gap = Math.max(0, race.pacer - todayTotals.points)
  const title = celebrate ? 'Past a typical day.' : 'That counted.'
  const minutesLine = `${lastRecap.minutes} ${lastRecap.minutes === 1 ? 'minute' : 'minutes'} on "${lastRecap.title}".`
  const msg = !showRace
    ? minutesLine
    : ahead
      ? `${race.passed} of your last ${race.ghosts.length} days are behind you now.`
      : race.hasField
        ? race.passed > 0
          ? `${race.passed} ${race.passed === 1 ? 'day' : 'days'} passed. ${gap} pts to typical.`
          : `${gap} pts to a typical day. No hurry.`
        : 'First points on the board. Tomorrow has something to race.'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {celebrate && <Confetti fall={420} />}
      <View className="flex-1 items-center justify-center" style={{ padding: 20 }}>
        <Animated.Text
          entering={FadeIn.duration(240)}
          className="font-hk800 text-accent text-[11px]"
          style={{ letterSpacing: 1.5 }}
        >
          {expired ? "TIME'S UP" : 'SESSION COMPLETE'}
        </Animated.Text>

        <Animated.View
          entering={ZoomIn.duration(260).delay(80)}
          className="mt-2.5"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Sprite pose="cheer" level={Math.max(level, 1)} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(140).duration(240)}
          className="font-hk800 text-ink text-[23px] mt-1 text-center"
          maxFontSizeMultiplier={TITLE_SCALE}
          style={{ letterSpacing: -0.3 }}
          accessibilityRole="header"
        >
          {title}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(190).duration(240)}
          className="font-hk400 text-muted text-center text-[13.5px] mt-2"
          style={{ maxWidth: 280, lineHeight: 20 }}
          numberOfLines={4}
          accessibilityLabel={spoken(msg)}
        >
          {msg}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(240).duration(240)}
          className="flex-row mt-5 w-full"
          style={{ gap: 10 }}
        >
          <View
            className="flex-1 bg-surface border border-soft"
            style={{ borderRadius: 16, padding: 14 }}
            accessible
            accessibilityLabel={`Plus ${lastRecap.points} points this session: ${parts.start} for starting${parts.focus > 0 ? `, ${parts.focus} focused` : ''}.`}
          >
            <Text className="font-mono text-accent text-[24px]" style={{ letterSpacing: -0.5 }} maxFontSizeMultiplier={TITLE_SCALE}>
              +{sessionPts}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">PTS THIS SESSION</Text>
            {/* Naming the start portion once per session is the point of the
                scoring change — the reward for beginning should be something
                you can see, not a number folded invisibly into a total. */}
            <Text className="font-hk400 text-muted text-[11px] mt-1.5" style={{ lineHeight: 14 }}>
              {parts.start} for starting{parts.focus > 0 ? ` · ${parts.focus} focused` : ''}
            </Text>
          </View>
          <View
            className="flex-1 bg-surface border border-soft"
            style={{ borderRadius: 16, padding: 14 }}
            accessible
            accessibilityLabel={`${todayTotals.points} points of momentum today.`}
          >
            <Text className="font-mono text-ink text-[24px]" style={{ letterSpacing: -0.5 }} maxFontSizeMultiplier={TITLE_SCALE}>
              {momentumPts}
            </Text>
            <Text className="font-hk600 text-muted text-[11px]">MOMENTUM TODAY</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(290).duration(240)} className="w-full">
          {expired && taskStillThere ? (
            <>
              {/* The clock ran out, which says nothing about the work. Asked
                  rather than assumed: deleting an unfinished task is the failure
                  that matters here, and both answers still keep the points. */}
              <Text
                className="font-hk700 text-ink text-center text-[14px] mt-6"
                numberOfLines={2}
              >
                Did you finish it?
              </Text>
              <View className="flex-row mt-2.5" style={{ gap: 10 }}>
                <PressableScale
                  haptic
                  onPress={goHome}
                  className="flex-1 items-center bg-surface border border-soft"
                  style={{ borderRadius: 16, paddingVertical: 16 }}
                  accessibilityHint="Keeps the task on your list"
                >
                  <Text className="font-hk700 text-ink text-[15px]">Not yet</Text>
                </PressableScale>
                <PressableScale
                  haptic
                  onPress={finished}
                  className="flex-1 items-center bg-accent"
                  style={{ borderRadius: 16, paddingVertical: 16 }}
                  accessibilityHint="Takes the task off your list"
                >
                  <Text className="font-hk700 text-on-accent text-[15px]">Finished it</Text>
                </PressableScale>
              </View>
              <Pressable
                onPress={anotherRound}
                hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                className="self-center mt-4"
                accessibilityRole="button"
              >
                <Text className="font-hk700 text-accent text-[13.5px]">
                  Go another {settings.focusLen} minutes
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <PressableScale
                haptic
                onPress={goHome}
                className="bg-accent items-center mt-6 w-full"
                style={{ borderRadius: 16, paddingVertical: 16 }}
              >
                <Text className="font-hk700 text-on-accent text-[15px]">Back home</Text>
              </PressableScale>
              {lastRecap.task && !taskStillThere && (
                <Pressable
                  onPress={putBack}
                  hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                  className="self-center mt-4"
                  accessibilityRole="button"
                >
                  <Text className="font-hk600 text-muted text-[13px]">
                    Not actually finished? Put it back on Today
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
