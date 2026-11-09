import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native'
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
import { Divider } from '@/components/ui/Group'

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
  const { height } = useWindowDimensions()
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

  // On a short phone the time's-up recap holds a question and three buttons as well,
  // so the cheer shrinks and the gaps close up rather than pushing anything off screen.
  const compact = height < 700
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
      {/* Centred when it fits, which is always at default sizes. At the largest text
          sizes it scrolls, so Back home can't be pushed off the bottom. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Animated.Text
          entering={FadeIn.duration(240)}
          className="font-hk700 text-accent text-footnote"
        >
          {expired ? "Time's up" : 'Session complete'}
        </Animated.Text>

        <Animated.View
          entering={ZoomIn.duration(260).delay(80)}
          style={{ marginTop: 6 }}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Sprite pose="cheer" level={Math.max(level, 1)} scale={compact ? 0.8 : 1.15} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(140).duration(240)}
          className="font-hk800 text-ink text-title1 text-center"
          maxFontSizeMultiplier={TITLE_SCALE}
          style={{ letterSpacing: -0.8, marginTop: 2 }}
          accessibilityRole="header"
        >
          {title}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(190).duration(240)}
          className="font-hk400 text-muted text-center text-subhead"
          style={{ maxWidth: 300, marginTop: 6 }}
          numberOfLines={4}
          accessibilityLabel={spoken(msg)}
        >
          {msg}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(240).duration(240)}
          className="bg-surface border border-soft w-full"
          style={{ borderRadius: 22, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, marginTop: compact ? 16 : 24 }}
        >
          <View className="flex-row items-end justify-between" style={{ gap: 12 }}>
            <View
              className="flex-1"
              accessible
              accessibilityLabel={`Plus ${lastRecap.points} points this session: ${parts.start} for starting${parts.focus > 0 ? `, ${parts.focus} focused` : ''}.`}
            >
              <Text
                className="font-mono600 text-accent"
                style={{ fontSize: 40, letterSpacing: -1.5 }}
                maxFontSizeMultiplier={TITLE_SCALE}
              >
                +{sessionPts}
              </Text>
              <Text className="font-hk600 text-muted text-footnote" maxFontSizeMultiplier={1.4}>
                points this session
              </Text>
            </View>
            <View
              className="items-end"
              accessible
              accessibilityLabel={`${todayTotals.points} points of momentum today.`}
            >
              <Text
                className="font-mono600 text-ink text-title2"
                style={{ letterSpacing: -0.5 }}
                maxFontSizeMultiplier={TITLE_SCALE}
              >
                {momentumPts}
              </Text>
              <Text className="font-hk600 text-muted text-footnote" maxFontSizeMultiplier={1.4}>
                today
              </Text>
            </View>
          </View>
          <View style={{ marginVertical: 12 }}>
            <Divider inset={0} />
          </View>
          {/* Naming the start portion once per session is the point of the
              scoring change — the reward for beginning should be something
              you can see, not a number folded invisibly into a total. */}
          <Text className="font-hk500 text-muted text-footnote">
            {parts.start} for starting{parts.focus > 0 ? `, ${parts.focus} for the focus` : ''}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(290).duration(240)} className="w-full">
          {expired && taskStillThere ? (
            <>
              {/* The clock ran out, which says nothing about the work. Asked
                  rather than assumed: deleting an unfinished task is the failure
                  that matters here, and both answers still keep the points. */}
              <Text
                className="font-hk700 text-ink text-center text-headline"
                style={{ marginTop: compact ? 16 : 26 }}
                numberOfLines={2}
              >
                Did you finish it?
              </Text>
              <View className="flex-row" style={{ gap: 10, marginTop: 12 }}>
                <PressableScale
                  haptic
                  onPress={goHome}
                  className="flex-1 items-center bg-surface border border-soft"
                  style={{ borderRadius: 18, paddingVertical: 16 }}
                  accessibilityHint="Keeps the task on your list"
                >
                  <Text className="font-hk700 text-ink text-headline">Not yet</Text>
                </PressableScale>
                <PressableScale
                  haptic
                  onPress={finished}
                  className="flex-1 items-center bg-accent"
                  style={{ borderRadius: 18, paddingVertical: 16 }}
                  accessibilityHint="Takes the task off your list"
                >
                  <Text className="font-hk700 text-on-accent text-headline">Finished it</Text>
                </PressableScale>
              </View>
              <Pressable
                onPress={anotherRound}
                hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                className="self-center mt-4"
                accessibilityRole="button"
              >
                <Text className="font-hk700 text-accent text-subhead">
                  Go another {settings.focusLen} minutes
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <PressableScale
                haptic
                onPress={goHome}
                className="bg-accent items-center w-full"
                style={{ borderRadius: 18, paddingVertical: 16, marginTop: compact ? 16 : 24 }}
              >
                <Text className="font-hk700 text-on-accent text-headline">Back home</Text>
              </PressableScale>
              {lastRecap.task && !taskStillThere && (
                <Pressable
                  onPress={putBack}
                  hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                  className="self-center mt-4"
                  accessibilityRole="button"
                >
                  <Text className="font-hk600 text-muted text-footnote">
                    Not actually finished? Put it back on Today
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
