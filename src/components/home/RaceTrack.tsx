import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Sprite from '@/components/Sprite'
import { hexA, useColors } from '@/lib/theme'
import { levelForPoints, RaceField } from '@/lib/points'
import { EASE_OUT } from '@/lib/motion'

const SPRITE_SCALE = 0.68
const GHOST_SCALE = 0.54
const SPRITE_W = 130 * SPRITE_SCALE
/** a sprite's feet sit this far down its box, so it can stand on the lane */
const FEET = 0.85
const LANE_H = 10
const LABEL_H = 18
const TRACK_H = 100
const LANE_TOP = TRACK_H - LABEL_H - LANE_H
const BEAD = 6
/** where the pacer sits on the track — leaves room to run past it */
const PACER_AT = 0.72
const EDGE = 0.98
/** Gentle mode has no target to scale against, so the runner eases along a curve. */
const GENTLE_HALFWAY_PTS = 80
/** how long the runner takes to reach its new place, and how long it sprints for */
const RUN_MS = 620
const SPRINT_MS = 2600

interface Props {
  /** where the runner stands, in today's points */
  points: number
  /**
   * The points the lane is drawn to fit, when that isn't where the runner is. The
   * recap starts the runner where it was before the session and moves it to where
   * it is now, and the beads shouldn't slide about underneath it on the way.
   */
  scalePoints?: number
  race: RaceField
  gentle: boolean
  level: number
  /**
   * False holds the runner where it is. Home stays mounted under the Focus screen
   * and the recap, and a move made behind them is a move nobody saw.
   */
  live?: boolean
  /** saved data has loaded, so a change from here on is a real one */
  ready?: boolean
  /** a one-shot cheer that outranks everything else */
  cheering?: boolean
  /** what the runner does once it's standing still */
  rest?: 'idle' | 'cheer'
}

/**
 * The lane: you, the recent days as beads, and a typical day standing on its mark.
 * Shared by Home, where it's the day so far, and the recap, where it's the move
 * the session just bought.
 */
export default function RaceTrack({
  points,
  scalePoints = points,
  race,
  gentle,
  level,
  live = true,
  ready = true,
  cheering = false,
  rest = 'idle',
}: Props) {
  const palette = useColors()
  const reduced = useReducedMotion()
  const [trackW, setTrackW] = useState(0)

  const showField = race.hasField && !gentle
  // Scale is anchored on the pacer, never on the best day — a record
  // shouldn't quietly become the thing you get measured against.
  const trackMax = Math.max(race.pacer / PACER_AT, scalePoints * 1.12, 1)
  const frac = (p: number) => Math.max(0, Math.min(EDGE, p / trackMax))

  const runnerFrac = showField
    ? frac(points)
    : gentle
      ? Math.max(0.04, Math.min(EDGE, points / (points + GENTLE_HALFWAY_PTS)))
      : points > 0
        ? 0.5
        : 0.04
  const pacerFrac = showField ? frac(race.pacer) : 0
  const pacerLevel = levelForPoints(race.pacer)

  // Everything below reacts to change, and loading saved data isn't a change.
  // Compared against the pre-hydration zeros, every cold start with points on the
  // board looked like a move.
  const placed = useRef(false)
  const x = useSharedValue(0)
  useEffect(() => {
    if (trackW <= 0 || !ready) return
    // the first placement isn't a move, so it never waits
    if (placed.current && !live) return
    const target = runnerFrac * trackW - SPRITE_W / 2
    if (reduced || !placed.current) x.value = target
    else x.value = withTiming(target, { duration: RUN_MS, easing: EASE_OUT })
    placed.current = true
  }, [runnerFrac, trackW, x, reduced, ready, live])
  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const trailStyle = useAnimatedStyle(() => ({
    width: Math.max(0, x.value + SPRITE_W / 2),
  }))

  // The runner sprints only while it's actually moving, then settles. A
  // permanent 500ms run cycle is fast ambient motion in the primary card —
  // it re-grabs the eye every loop for the whole day and says nothing new.
  const [moving, setMoving] = useState(false)
  const prevPoints = useRef<number | null>(null)
  useEffect(() => {
    // not noted while held, so the change is still news once it's let go
    if (!ready || !live) return
    const prev = prevPoints.current
    prevPoints.current = points
    if (prev == null || points === prev) return
    setMoving(true)
    const t = setTimeout(() => setMoving(false), SPRINT_MS)
    return () => clearTimeout(t)
  }, [points, ready, live])

  return (
    <View style={{ height: TRACK_H }} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
      {/* the lane */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: LANE_TOP,
          height: LANE_H,
          borderRadius: LANE_H / 2,
          backgroundColor: palette.soft,
        }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: LANE_TOP,
            height: LANE_H,
            borderRadius: LANE_H / 2,
            backgroundColor: palette.accent,
          },
          trailStyle,
        ]}
      />

      {/* each recent day is a bead on the lane, turning light once you pass it */}
      {showField &&
        trackW > 0 &&
        race.ghosts.map((g) => (
          <View
            key={g.day}
            style={{
              position: 'absolute',
              left: Math.max(LANE_H / 2, Math.min(trackW - LANE_H / 2, frac(g.points) * trackW)) - BEAD / 2,
              top: LANE_TOP + (LANE_H - BEAD) / 2,
              width: BEAD,
              height: BEAD,
              borderRadius: BEAD / 2,
              backgroundColor: points >= g.points ? palette.onAccent : hexA(palette.muted, 0.55),
            }}
          />
        ))}

      {/* the pacer: a typical day, with a past self standing on it */}
      {showField && trackW > 0 && (
        <>
          <View
            style={{
              position: 'absolute',
              left: pacerFrac * trackW - 1,
              top: LANE_TOP - 8,
              height: LANE_H + 16,
              width: 2,
              borderRadius: 1,
              backgroundColor: palette.muted,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: pacerFrac * trackW - (130 * GHOST_SCALE) / 2,
              top: LANE_TOP - 8 - 140 * GHOST_SCALE * FEET,
            }}
          >
            <Sprite ghost level={pacerLevel} scale={GHOST_SCALE} />
          </View>
          {/* clamped so the label can never run off the card edge */}
          <Text
            className="font-hk600 text-muted text-micro"
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: Math.max(0, Math.min(trackW - 84, pacerFrac * trackW - 42)),
              top: LANE_TOP + LANE_H + 4,
              width: 84,
              textAlign: 'center',
            }}
          >
            Typical day
          </Text>
        </>
      )}

      {/* you */}
      <Animated.View
        style={[
          { position: 'absolute', left: 0, top: LANE_TOP + 3 - 140 * SPRITE_SCALE * FEET },
          runnerStyle,
        ]}
      >
        <Sprite
          pose={cheering ? 'cheer' : moving ? 'run' : rest}
          // animates while it's saying something, then holds the pose
          calm={!cheering && !moving}
          level={level}
          scale={SPRITE_SCALE}
        />
      </Animated.View>
    </View>
  )
}
