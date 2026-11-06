import { useEffect, useState } from 'react'
import { Platform, View, ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '@/lib/theme'

export type SpritePose = 'run' | 'idle' | 'wave' | 'cheer'

interface SpriteProps {
  pose?: SpritePose
  /** faded, static past-self pace-marker */
  ghost?: boolean
  /** grows the body: 0.6 + level * 0.045, capped at level 9 */
  level?: number
  /** overall render scale — 1 = 130×140 points */
  scale?: number
  /**
   * Hold the pose without any looping motion. For sprites that live
   * permanently on screen: a run cycle or cheer bob that never stops is fast
   * ambient motion, and repeated onsets re-capture attention every loop.
   */
  calm?: boolean
}

// intrinsic canvas the part coordinates below are authored against
const W = 130
const H = 140
const BODY_W = 74
const BODY_H = 98

const ease = Easing.inOut(Easing.ease)

/**
 * A cheer or a wave is something it says, not a state it's in, so it finishes and
 * holds the pose. Left looping they ran for as long as the screen stayed open,
 * which breaks "nothing loops" and sits over the 5s limit in WCAG 2.2.2.
 */
const GESTURE_MS = 4000

/** ping-pong a shared value between two angles forever */
function swing(v: SharedValue<number>, from: number, to: number, duration: number) {
  v.value = from
  v.value = withRepeat(
    withSequence(
      withTiming(to, { duration: duration / 2, easing: ease }),
      withTiming(from, { duration: duration / 2, easing: ease })
    ),
    -1
  )
}

function settle(v: SharedValue<number>, angle: number) {
  cancelAnimation(v)
  v.value = withTiming(angle, { duration: 220, easing: ease })
}

/** limb rotating about its top-center, like a shoulder/hip joint */
function Limb({
  angle,
  width,
  height,
  style,
}: {
  angle: SharedValue<number>
  width: number
  height: number
  style: ViewStyle
}) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: -height / 2 },
      { rotate: `${angle.value}deg` },
      { translateY: height / 2 },
    ],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width,
          height,
          borderRadius: width * 0.65,
          backgroundColor: palette.accent,
        },
        style,
        animated,
      ]}
    />
  )
}

/** headband tail fluttering about its left edge */
function BandTail({
  angle,
  width,
  style,
}: {
  angle: SharedValue<number>
  width: number
  style: ViewStyle
}) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width / 2 },
      { rotate: `${angle.value}deg` },
      { translateX: width / 2 },
    ],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width,
          height: 4,
          borderRadius: 3,
          backgroundColor: '#fff',
        },
        style,
        animated,
      ]}
    />
  )
}

function DustTrail() {
  const pieces = [
    { top: 46, width: 16, opacity: 0.3, delay: 0 },
    { top: 60, width: 24, opacity: 0.45, delay: 180 },
    { top: 74, width: 16, opacity: 0.3, delay: 340 },
  ]
  return (
    <View style={{ position: 'absolute', left: 0, top: 0 }}>
      {pieces.map((p, i) => (
        <DustPiece key={i} {...p} />
      ))}
    </View>
  )
}

function DustPiece({
  top,
  width,
  opacity,
  delay,
}: {
  top: number
  width: number
  opacity: number
  delay: number
}) {
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 500, easing: Easing.linear }), -1)
    )
    return () => cancelAnimation(t)
  }, [t, delay])
  const style = useAnimatedStyle(() => ({
    opacity: opacity * (1 - t.value),
    transform: [{ translateX: -16 * t.value }, { scaleX: 0.6 + 0.5 * t.value }],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left: 0,
          width,
          height: 3,
          borderRadius: 2,
          backgroundColor: palette.accent,
        },
        style,
      ]}
    />
  )
}

export default function Sprite({
  pose = 'idle',
  ghost = false,
  level = 4,
  scale = 1,
  calm = false,
}: SpriteProps) {
  const reducedMotion = useReducedMotion()
  const effectivePose: SpritePose = ghost ? 'idle' : pose

  const [spent, setSpent] = useState(false)
  useEffect(() => {
    setSpent(false)
    if (effectivePose !== 'cheer' && effectivePose !== 'wave') return
    const timer = setTimeout(() => setSpent(true), GESTURE_MS)
    return () => clearTimeout(timer)
  }, [effectivePose])

  const animate = !ghost && !reducedMotion && !calm && !spent

  const bob = useSharedValue(0) // translateY of the whole body
  const breathe = useSharedValue(1) // scale of the whole body
  const legF = useSharedValue(-5)
  const legB = useSharedValue(5)
  const armF = useSharedValue(-11)
  const armB = useSharedValue(11)
  const band = useSharedValue(16)
  const band2 = useSharedValue(16)

  useEffect(() => {
    const all = [bob, breathe, legF, legB, armF, armB, band, band2]
    all.forEach(cancelAnimation)
    // eased rather than snapped, so a gesture finishing doesn't visibly jump
    settle(breathe, 1)
    settle(bob, 0)

    if (effectivePose === 'run') {
      settle(band2, 16)
      if (animate) {
        swing(bob, 0, -3, 500)
        swing(legF, -28, 16, 500)
        swing(legB, 30, -14, 500)
        swing(armF, -36, 8, 500)
        swing(armB, 38, -8, 500)
        swing(band, 16, 26, 500)
        swing(band2, 14, 24, 500)
      } else {
        settle(legF, -28)
        settle(legB, 30)
        settle(armF, -36)
        settle(armB, 38)
        settle(band, 20)
      }
    } else if (effectivePose === 'cheer') {
      settle(legF, -13)
      settle(legB, 13)
      // A positive angle swings a limb up and to the left, so the right-hand arm
      // reaches outward at a negative one. Crossed the other way they pass behind
      // the head, which is drawn after them, and the arms disappear.
      settle(armF, -150)
      settle(armB, 150)
      settle(band, 16)
      settle(band2, 16)
      if (animate) swing(bob, 0, -7, 600)
    } else if (effectivePose === 'wave') {
      settle(legF, -5)
      settle(legB, 5)
      settle(armB, 11)
      settle(band, 16)
      settle(band2, 16)
      if (animate) {
        swing(armF, -150, -124, 1100)
        swing(breathe, 1, 1.04, 3000)
      } else {
        settle(armF, -137)
      }
    } else {
      // idle — also the ghost's resting pose
      settle(legF, -5)
      settle(legB, 5)
      settle(armB, 11)
      settle(band, 16)
      settle(band2, 16)
      settle(armF, -11)
      // the one thing allowed to idle: see the doctrine in lib/motion.ts
      if (animate) swing(breathe, 1, 1.04, 3000)
    }
    return () => all.forEach(cancelAnimation)
  }, [effectivePose, animate, bob, breathe, legF, legB, armF, armB, band, band2])

  const bodyMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: breathe.value }],
  }))

  const cap = Math.min(Math.max(level, 0), 9)
  const bodyScale = (ghost ? 0.82 : 1) * (0.6 + cap * 0.045)
  const glow = ghost ? 0 : 5 + cap * 2.4
  const openMouth = effectivePose === 'cheer'

  return (
    <View
      style={{ width: W * scale, height: H * scale }}
      // a character, not content: everything it conveys is said in words nearby
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          position: 'absolute',
          width: W,
          height: H,
          opacity: ghost ? 0.3 : 1,
          transform: [
            { translateX: (scale - 1) * (W / 2) },
            { translateY: (scale - 1) * (H / 2) },
            { scale },
          ],
        }}
      >
        {animate && effectivePose === 'run' && <DustTrail />}

        <View
          style={{
            position: 'absolute',
            left: (W - BODY_W) / 2,
            top: (H - BODY_H) / 2,
            width: BODY_W,
            height: BODY_H,
            // feet stay planted while the body grows with level
            transform: [{ translateY: ((1 - bodyScale) * BODY_H) / 2 }, { scale: bodyScale }],
            // iOS casts this from the shape of what's drawn, which is the glow.
            // Web would cast it from the bounding box, a visible rectangle.
            ...(Platform.OS === 'ios' && !ghost
              ? {
                  shadowColor: palette.accent,
                  shadowOpacity: 0.55,
                  shadowRadius: glow,
                  shadowOffset: { width: 0, height: 4 },
                }
              : null),
          }}
        >
          <Animated.View style={[{ position: 'absolute', width: BODY_W, height: BODY_H }, bodyMotion]}>
            {/* back leg */}
            <Limb angle={legB} width={11} height={34} style={{ top: 58, left: 22, opacity: 0.93 }} />
            {/* front leg */}
            <Limb angle={legF} width={11} height={34} style={{ top: 58, left: 40 }} />
            {/* back arm — tucked under the torso's left edge (x24) so it stays
                attached through its full swing instead of floating free */}
            <Limb angle={armB} width={9} height={26} style={{ top: 38, left: 20, opacity: 0.9 }} />
            {/* torso */}
            <View
              style={{
                position: 'absolute',
                top: 34,
                left: 24,
                width: 28,
                height: 32,
                borderRadius: 13,
                backgroundColor: palette.accent,
                transform: [{ rotate: '-6deg' }],
              }}
            />
            {/* front arm */}
            <Limb angle={armF} width={9} height={25} style={{ top: 36, left: 44 }} />
            {/* head */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 21,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: palette.accent,
              }}
            >
              {/* headband */}
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: -2,
                  right: -2,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  opacity: 0.85,
                }}
              />
              <BandTail angle={band} width={11} style={{ top: 7, right: -9, opacity: 0.8 }} />
              <BandTail angle={band2} width={13} style={{ top: 12, right: -10, opacity: 0.55 }} />
              {/* eyes */}
              <View style={{ position: 'absolute', top: 19, left: 12, width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
              <View style={{ position: 'absolute', top: 19, left: 21, width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
              {/* mouth */}
              {openMouth ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 25,
                    left: 13,
                    width: 11,
                    height: 9,
                    borderTopLeftRadius: 5,
                    borderTopRightRadius: 5,
                    borderBottomLeftRadius: 6,
                    borderBottomRightRadius: 6,
                    backgroundColor: '#fff',
                  }}
                />
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    top: 26,
                    left: 13,
                    width: 11,
                    height: 6,
                    borderWidth: 2,
                    borderTopWidth: 0,
                    borderColor: '#fff',
                    borderBottomLeftRadius: 9,
                    borderBottomRightRadius: 9,
                  }}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  )
}
