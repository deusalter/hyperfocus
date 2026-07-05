import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { EASE_OUT } from '@/lib/motion'
import * as Haptics from 'expo-haptics'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import { useApp } from '@/store/AppStore'
import { palette, hexA } from '@/lib/theme'
import { levelForPoints } from '@/lib/points'

const SPRITE_SCALE = 0.52
const GHOST_SCALE = 0.46
const SPRITE_W = 130 * SPRITE_SCALE

function AheadBadge() {
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1
    )
  }, [pulse])
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))
  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      className="bg-accent rounded-full"
      style={[{ paddingHorizontal: 10, paddingVertical: 4 }, style]}
    >
      <Text className="font-hk800 text-white text-[9.5px]" style={{ letterSpacing: 0.6 }}>
        AHEAD OF YESTERDAY
      </Text>
    </Animated.View>
  )
}

/** "You & Yesterday" — the live race against your past self. */
export default function RaceCard() {
  const { todayTotals, baseline, ahead, level } = useApp()
  const [trackW, setTrackW] = useState(0)

  const pastPts = baseline?.totals.points ?? 0
  const pct = Math.min(100, Math.round((todayTotals.points / Math.max(pastPts, 1)) * 100))
  const raceLeftPct = ahead ? 90 : Math.max(6, Math.min(86, Math.round(pct * 0.86)))

  const x = useSharedValue(0)
  useEffect(() => {
    if (trackW > 0) {
      x.value = withTiming((raceLeftPct / 100) * trackW - SPRITE_W / 2, {
        duration: 550,
        easing: EASE_OUT,
      })
    }
  }, [raceLeftPct, trackW, x])
  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  // accent trail fills the track behind the runner
  const trailStyle = useAnimatedStyle(() => ({
    width: Math.max(0, x.value + SPRITE_W / 2),
  }))

  // level-up moment: cheer + haptic when today's points cross a level boundary
  const [levelBurst, setLevelBurst] = useState(false)
  const prevLevel = useRef(level)
  useEffect(() => {
    const prev = prevLevel.current
    prevLevel.current = level
    if (level > prev) {
      setLevelBurst(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      const t = setTimeout(() => setLevelBurst(false), 2200)
      return () => clearTimeout(t)
    }
  }, [level])

  const gap = Math.max(0, pastPts - todayTotals.points)
  const pastLevel = baseline ? levelForPoints(pastPts) : 0

  const msg = !baseline
    ? 'Day one. No ghosts yet — every point today becomes tomorrow’s pace-marker.'
    : ahead
      ? 'Past you would be proud — you’re ahead of yesterday.'
      : todayTotals.points === 0
        ? `Yesterday you reached ${pastPts} pts. No rush — one session starts the climb.`
        : `Just ${gap} pts to meet yesterday. Totally reachable.`
  const subMsg = !baseline
    ? 'Finish anything — even tiny — and the race begins.'
    : ahead
      ? 'However today goes from here, it already counts.'
      : 'Bad days count too. Showing up is the win.'

  return (
    <View
      className="bg-surface border border-soft"
      style={{ borderRadius: 22, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, overflow: 'hidden' }}
    >
      {ahead && <Confetti />}

      <View className="flex-row items-center justify-between">
        <Text className="font-hk700 text-muted text-[11px]" style={{ letterSpacing: 0.5 }}>
          YOU &amp; YESTERDAY
        </Text>
        {ahead && <AheadBadge />}
      </View>

      <View
        style={{ height: 84, marginTop: 8, overflow: 'hidden' }}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
        {/* track */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 20,
            height: 4,
            borderRadius: 3,
            backgroundColor: palette.soft,
          }}
        />
        {/* trail the runner has covered */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              bottom: 20,
              height: 4,
              borderRadius: 3,
              backgroundColor: hexA(palette.accent, 0.35),
            },
            trailStyle,
          ]}
        />
        {baseline && (
          <>
            {/* yesterday's finish line + ghost */}
            <View
              style={{
                position: 'absolute',
                left: '90%',
                bottom: 16,
                top: 8,
                width: 2,
                borderRadius: 2,
                backgroundColor: palette.muted,
                opacity: 0.4,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: '90%',
                top: -2,
                marginLeft: (-130 * GHOST_SCALE) / 2,
              }}
            >
              <Sprite ghost level={pastLevel} scale={GHOST_SCALE} />
            </View>
            <Text
              className="font-hk700 text-muted"
              style={{
                position: 'absolute',
                left: '90%',
                bottom: 1,
                fontSize: 8.5,
                letterSpacing: 0.3,
                transform: [{ translateX: -24 }],
              }}
            >
              YESTERDAY
            </Text>
          </>
        )}
        {/* you */}
        <Animated.View style={[{ position: 'absolute', left: 0, top: 2 }, runnerStyle]}>
          <Sprite
            pose={
              ahead || levelBurst ? 'cheer' : todayTotals.points > 0 ? 'run' : 'idle'
            }
            level={Math.max(level, ahead ? pastLevel : 0)}
            scale={SPRITE_SCALE}
          />
        </Animated.View>
      </View>

      <Text
        className="font-hk600 text-ink text-center text-[13.5px] mt-1.5"
        style={{ lineHeight: 19 }}
      >
        {msg}
      </Text>
      <Text className="font-hk400 text-muted text-center text-[11.5px] mt-1" style={{ lineHeight: 15 }}>
        {subMsg}
      </Text>
    </View>
  )
}
