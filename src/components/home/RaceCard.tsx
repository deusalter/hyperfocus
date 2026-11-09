import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Sprite from '@/components/Sprite'
import Confetti from '@/components/Confetti'
import { useApp } from '@/store/AppStore'
import { TITLE_SCALE, hexA, useColors } from '@/lib/theme'
import { levelForPoints, RaceField } from '@/lib/points'
import { EASE_OUT } from '@/lib/motion'
import { sentence, spoken } from '@/lib/speech'

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

/**
 * "You & your recent days" — the live race against a field of past selves.
 *
 * The field matters. Racing one previous day ratchets: a good day sets a bar
 * you then have to clear, so success guarantees a later failure and the loss
 * lands hardest right after you did well. This races the last several active
 * days at once and marks the target at a *typical* day rather than a record
 * one. The headline is how many you've passed — graded, so there's no single
 * line whose far side is failure.
 *
 * Gentle mode drops the field entirely. For some people any comparison stings,
 * however kindly it's worded, so there the runner only ever shows today's progress.
 */
export default function RaceCard() {
  const palette = useColors()
  const { todayTotals, race, level, settings, hydrated } = useApp()
  const [trackW, setTrackW] = useState(0)
  const reduced = useReducedMotion()

  const gentle = settings.gentle
  const showField = race.hasField && !gentle
  const pts = todayTotals.points
  // Scale is anchored on the pacer, never on the best day — a record
  // shouldn't quietly become the thing you get measured against.
  const trackMax = Math.max(race.pacer / PACER_AT, pts * 1.12, 1)
  const frac = (p: number) => Math.max(0, Math.min(EDGE, p / trackMax))

  const runnerFrac = showField
    ? frac(pts)
    : gentle
      ? Math.max(0.04, Math.min(EDGE, pts / (pts + GENTLE_HALFWAY_PTS)))
      : pts > 0
        ? 0.5
        : 0.04
  const pacerFrac = showField ? frac(race.pacer) : 0

  // Everything below reacts to change, and loading saved data isn't a change.
  // Compared against the pre-hydration zeros, every cold start with points on the
  // board looked like a level-up: confetti and a success haptic on opening the app.
  const placed = useRef(false)
  const x = useSharedValue(0)
  useEffect(() => {
    if (trackW <= 0 || !hydrated) return
    const target = runnerFrac * trackW - SPRITE_W / 2
    if (reduced || !placed.current) x.value = target
    else x.value = withTiming(target, { duration: 620, easing: EASE_OUT })
    placed.current = true
  }, [runnerFrac, trackW, x, reduced, hydrated])
  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const trailStyle = useAnimatedStyle(() => ({
    width: Math.max(0, x.value + SPRITE_W / 2),
  }))

  // level-up: a one-shot cheer, not an ambience
  const [burstKey, setBurstKey] = useState(0)
  const [cheering, setCheering] = useState(false)
  const prevLevel = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    const prev = prevLevel.current
    prevLevel.current = level
    if (prev != null && level > prev) {
      setBurstKey((k) => k + 1)
      setCheering(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      const t = setTimeout(() => setCheering(false), 1800)
      return () => clearTimeout(t)
    }
  }, [level, hydrated])

  // celebrate crossing the pacer once, not for the rest of the day
  const [paceKey, setPaceKey] = useState(0)
  const wasAhead = useRef<boolean | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (race.ahead && wasAhead.current === false && !gentle) setPaceKey((k) => k + 1)
    wasAhead.current = race.ahead
  }, [race.ahead, hydrated, gentle])

  // The runner sprints only while it's actually moving, then settles. A
  // permanent 500ms run cycle is fast ambient motion in the primary card —
  // it re-grabs the eye every loop for the whole day and says nothing new.
  const [moving, setMoving] = useState(false)
  const prevPts = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    const prev = prevPts.current
    prevPts.current = pts
    if (prev == null || pts === prev) return
    setMoving(true)
    const t = setTimeout(() => setMoving(false), 2600)
    return () => clearTimeout(t)
  }, [pts, hydrated])

  const { title, detail, sub, said } = gentle ? gentleMessage(pts) : message(race, pts)
  const pacerLevel = levelForPoints(race.pacer)
  // gentle mode's headline is already today's points
  const showPts = !gentle && (race.hasField || pts > 0)
  const { completed, minutes } = todayTotals
  const facts = [
    completed > 0 ? `${completed} ${completed === 1 ? 'task' : 'tasks'} done` : null,
    minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} focused` : null,
  ].filter(Boolean)
  const spokenLabel = [
    said ? sentence(said) : [title, detail].filter(Boolean).map((t) => sentence(t as string)).join(' '),
    showPts && !said ? `${pts} pts today.` : null,
    sub,
    facts.length ? sentence(facts.join(', ')) : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      className="bg-surface border border-soft"
      style={{ borderRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, overflow: 'hidden' }}
      // the track is a picture of these sentences, so read it as them
      accessible
      accessibilityLabel={spoken(spokenLabel)}
    >
      {burstKey + paceKey > 0 && <Confetti key={`c${burstKey}-${paceKey}`} />}

      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View className="flex-1" style={{ minWidth: 0 }}>
          <Text
            className="font-hk800 text-ink text-title3"
            style={{ letterSpacing: -0.4 }}
            maxFontSizeMultiplier={TITLE_SCALE}
          >
            {title}
          </Text>
          {detail && (
            <Text className="font-hk500 text-muted text-subhead" style={{ marginTop: 2 }} maxFontSizeMultiplier={TITLE_SCALE}>
              {detail}
            </Text>
          )}
        </View>
        {showPts && (
          <View className="items-end">
            <Text
              className="font-mono600 text-title3"
              style={{ color: race.ahead ? palette.accent : palette.ink, letterSpacing: -0.5 }}
              maxFontSizeMultiplier={TITLE_SCALE}
            >
              {pts}
            </Text>
            <Text className="font-hk600 text-muted text-caption" maxFontSizeMultiplier={1.4}>
              pts today
            </Text>
          </View>
        )}
      </View>

      <View
        style={{ height: TRACK_H, marginTop: 2 }}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
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
                backgroundColor: g.passed ? palette.onAccent : hexA(palette.muted, 0.55),
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
            pose={cheering ? 'cheer' : moving ? 'run' : race.ahead && !gentle ? 'cheer' : 'idle'}
            // animates while it's saying something, then holds the pose
            calm={!cheering && !moving}
            level={level}
            scale={SPRITE_SCALE}
          />
        </Animated.View>
      </View>

      <Text className="font-hk400 text-muted text-footnote" style={{ marginTop: 2 }}>
        {sub}
      </Text>
      {facts.length > 0 && (
        <View className="flex-row flex-wrap" style={{ columnGap: 16, rowGap: 4, marginTop: 12 }}>
          {facts.map((f) => (
            <Text key={f} className="font-hk700 text-ink text-footnote">
              {f}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * Copy stays descriptive, never evaluative. The response to failure feedback
 * runs hotter than the response to success, so a shortfall is stated as a
 * distance to cover — never as a verdict on the day.
 */
/** `said` stands in for a title too terse to hear on its own. */
interface Message {
  title: string
  detail?: string
  sub: string
  said?: string
}

function message(race: RaceField, pts: number): Message {
  if (!race.hasField) {
    return {
      title: 'Nothing to race yet',
      detail: 'Today sets the pace.',
      sub: 'Finish anything, even something tiny, and the field starts filling in.',
    }
  }
  if (race.ahead) {
    return race.passed === race.ghosts.length
      ? {
          title: 'Past every recent day',
          detail: `${pts - race.pacer} pts beyond a typical one.`,
          sub: 'However the rest of today goes, this already counts.',
        }
      : {
          title: 'Past a typical day',
          detail: `${race.passed} of your last ${race.ghosts.length} days are behind you.`,
          sub: 'However the rest of today goes, this already counts.',
        }
  }
  if (pts === 0) {
    return {
      title: `A typical day is ${race.pacer} pts`,
      sub: 'No rush. One small session puts a runner on the board.',
    }
  }
  if (race.passed > 0) {
    return {
      title: `${race.passed} of ${race.ghosts.length} passed`,
      detail: `${race.pacer - pts} pts to a typical day`,
      said: `Passed ${race.passed} of your last ${race.ghosts.length} days. ${race.pacer - pts} pts to a typical day.`,
      sub: 'Every one you pass stays passed.',
    }
  }
  return {
    title: `${race.pacer - pts} pts to a typical day`,
    sub: 'Quiet days count too. Showing up is the part that compounds.',
  }
}

function gentleMessage(pts: number): Message {
  return pts > 0
    ? { title: `${pts} pts so far today`, sub: 'However the rest of today goes, this counts.' }
    : { title: 'A fresh day', sub: 'One small thing is plenty to start with.' }
}
