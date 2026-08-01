import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import { useApp } from '@/store/AppStore'
import { palette, hexA } from '@/lib/theme'
import { levelForPoints, RaceField } from '@/lib/points'
import { EASE_OUT } from '@/lib/motion'

const SPRITE_SCALE = 0.5
const GHOST_SCALE = 0.44
const SPRITE_W = 130 * SPRITE_SCALE
const TRACK_H = 76
/** where the pacer sits on the track — leaves room to run past it */
const PACER_AT = 0.72
const EDGE = 0.98

function Badge({ label }: { label: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      className="bg-accent rounded-full"
      style={{ paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <Text className="font-hk800 text-white text-[9.5px]" style={{ letterSpacing: 0.6 }}>
        {label}
      </Text>
    </Animated.View>
  )
}

/**
 * "You & your recent days" — the live race against a field of past selves.
 *
 * The field matters. Racing one previous day ratchets: a good day sets a bar
 * you then have to clear, so success guarantees a later failure and the loss
 * lands hardest right after you did well. This races the last several active
 * days at once and marks the target at a *typical* day rather than a record
 * one. The headline is how many you've passed — graded, so there's no single
 * line whose far side is failure.
 */
export default function RaceCard() {
  const { todayTotals, race, level } = useApp()
  const [trackW, setTrackW] = useState(0)
  const reduced = useReducedMotion()

  const pts = todayTotals.points
  // Scale is anchored on the pacer, never on the best day — a record
  // shouldn't quietly become the thing you get measured against.
  const trackMax = Math.max(race.pacer / PACER_AT, pts * 1.12, 1)
  const frac = (p: number) => Math.max(0, Math.min(EDGE, p / trackMax))

  const runnerFrac = race.hasField ? frac(pts) : pts > 0 ? 0.5 : 0.04
  const pacerFrac = race.hasField ? frac(race.pacer) : 0

  const x = useSharedValue(0)
  useEffect(() => {
    if (trackW <= 0) return
    const target = runnerFrac * trackW - SPRITE_W / 2
    x.value = reduced ? target : withTiming(target, { duration: 620, easing: EASE_OUT })
  }, [runnerFrac, trackW, x, reduced])
  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const trailStyle = useAnimatedStyle(() => ({
    width: Math.max(0, x.value + SPRITE_W / 2),
  }))

  // level-up: a one-shot cheer, not an ambience
  const [burstKey, setBurstKey] = useState(0)
  const [cheering, setCheering] = useState(false)
  const prevLevel = useRef(level)
  useEffect(() => {
    const prev = prevLevel.current
    prevLevel.current = level
    if (level > prev) {
      setBurstKey((k) => k + 1)
      setCheering(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      const t = setTimeout(() => setCheering(false), 1800)
      return () => clearTimeout(t)
    }
  }, [level])

  // celebrate crossing the pacer once, not for the rest of the day
  const [paceKey, setPaceKey] = useState(0)
  const wasAhead = useRef(race.ahead)
  useEffect(() => {
    if (race.ahead && !wasAhead.current) setPaceKey((k) => k + 1)
    wasAhead.current = race.ahead
  }, [race.ahead])

  // The runner sprints only while it's actually moving, then settles. A
  // permanent 500ms run cycle is fast ambient motion in the primary card —
  // it re-grabs the eye every loop for the whole day and says nothing new.
  const [moving, setMoving] = useState(false)
  const prevPts = useRef(pts)
  useEffect(() => {
    if (pts === prevPts.current) return
    prevPts.current = pts
    setMoving(true)
    const t = setTimeout(() => setMoving(false), 2600)
    return () => clearTimeout(t)
  }, [pts])

  const { headline, sub } = message(race, pts)
  const pacerLevel = levelForPoints(race.pacer)

  return (
    <View
      className="bg-surface border border-soft"
      style={{
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 13,
        overflow: 'hidden',
      }}
    >
      {burstKey + paceKey > 0 && <Confetti key={`c${burstKey}-${paceKey}`} />}

      <View className="flex-row items-center justify-between" style={{ minHeight: 22 }}>
        <Text className="font-hk700 text-muted text-[11px]" style={{ letterSpacing: 0.5 }}>
          {race.hasField ? `PASSED ${race.passed} OF ${race.ghosts.length}` : 'YOUR FIRST DAY'}
        </Text>
        {race.ahead && <Badge label="PAST A TYPICAL DAY" />}
      </View>

      <View
        style={{ height: TRACK_H, marginTop: 6 }}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 18,
            height: 4,
            borderRadius: 3,
            backgroundColor: palette.soft,
          }}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              bottom: 18,
              height: 4,
              borderRadius: 3,
              backgroundColor: hexA(palette.accent, 0.4),
            },
            trailStyle,
          ]}
        />

        {/* one tick per recent day — fills in as you pass it */}
        {trackW > 0 &&
          race.ghosts.map((g) => (
            <View
              key={g.day}
              style={{
                position: 'absolute',
                left: frac(g.points) * trackW - 1.5,
                bottom: 14,
                width: 3,
                height: 12,
                borderRadius: 2,
                backgroundColor: g.passed ? palette.accent : palette.soft,
              }}
            />
          ))}

        {/* the pacer: a typical day, with a past self standing on it */}
        {race.hasField && trackW > 0 && (
          <>
            {/* stops at the ghost's feet — a taller rule reads as a flagpole */}
            <View
              style={{
                position: 'absolute',
                left: pacerFrac * trackW,
                bottom: 14,
                top: 34,
                width: 2,
                borderRadius: 2,
                backgroundColor: palette.muted,
                opacity: 0.35,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: pacerFrac * trackW - (130 * GHOST_SCALE) / 2,
                top: -6,
              }}
            >
              <Sprite ghost level={pacerLevel} scale={GHOST_SCALE} />
            </View>
            {/* clamped so the label can never run off the card edge */}
            <Text
              className="font-hk700 text-muted"
              style={{
                position: 'absolute',
                left: Math.max(0, Math.min(trackW - 64, pacerFrac * trackW - 32)),
                bottom: 0,
                width: 64,
                textAlign: 'center',
                fontSize: 8.5,
                letterSpacing: 0.3,
              }}
            >
              TYPICAL DAY
            </Text>
          </>
        )}

        {/* you */}
        <Animated.View style={[{ position: 'absolute', left: 0, top: -2 }, runnerStyle]}>
          <Sprite
            pose={cheering ? 'cheer' : moving ? 'run' : race.ahead ? 'cheer' : 'idle'}
            // animates while it's saying something, then holds the pose
            calm={!cheering && !moving}
            level={level}
            scale={SPRITE_SCALE}
          />
        </Animated.View>
      </View>

      <Text
        className="font-hk600 text-ink text-center text-[13.5px]"
        style={{ lineHeight: 19, marginTop: 2 }}
      >
        {headline}
      </Text>
      <Text
        className="font-hk400 text-muted text-center text-[11.5px]"
        style={{ lineHeight: 15, marginTop: 3 }}
      >
        {sub}
      </Text>
    </View>
  )
}

/**
 * Copy stays descriptive, never evaluative. The response to failure feedback
 * runs hotter than the response to success, so a shortfall is stated as a
 * distance to cover — never as a verdict on the day.
 */
function message(race: RaceField, pts: number): { headline: string; sub: string } {
  if (!race.hasField) {
    return {
      headline: 'Nothing to race yet — today sets the pace.',
      sub: 'Finish anything, even tiny, and the field starts filling in.',
    }
  }
  if (race.ahead) {
    return {
      headline:
        race.passed === race.ghosts.length
          ? 'Past every one of your recent days.'
          : `Past a typical day — ${race.passed} of ${race.ghosts.length} behind you.`,
      sub: 'However the rest of today goes, this already counts.',
    }
  }
  if (pts === 0) {
    return {
      headline: `A typical day for you is ${race.pacer} pts.`,
      sub: 'No rush. One small session puts a runner on the board.',
    }
  }
  if (race.passed > 0) {
    return {
      headline: `${race.passed} of ${race.ghosts.length} passed · ${race.pacer - pts} to typical`,
      sub: 'Every one you pass stays passed.',
    }
  }
  return {
    headline: `${race.pacer - pts} pts to a typical day.`,
    sub: 'Quiet days count too. Showing up is the part that compounds.',
  }
}
