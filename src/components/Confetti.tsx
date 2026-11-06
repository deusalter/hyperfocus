import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { useColors } from '@/lib/theme'
import { BURST_MS } from '@/lib/motion'

interface Piece {
  left: string
  tone: 'accent' | 'accent2'
  duration: number
  delay: number
  /** horizontal drift while falling, px */
  drift: number
  size: number
}

const PIECES: Piece[] = [
  { left: '6%', tone: 'accent', duration: 1100, delay: 0, drift: 14, size: 7 },
  { left: '18%', tone: 'accent2', duration: 1250, delay: 120, drift: -10, size: 6 },
  { left: '31%', tone: 'accent', duration: 1000, delay: 220, drift: 8, size: 8 },
  { left: '44%', tone: 'accent2', duration: 1200, delay: 60, drift: -16, size: 7 },
  { left: '57%', tone: 'accent', duration: 1120, delay: 180, drift: 12, size: 6 },
  { left: '70%', tone: 'accent2', duration: 1050, delay: 100, drift: -8, size: 8 },
  { left: '82%', tone: 'accent', duration: 1180, delay: 30, drift: 15, size: 7 },
  { left: '93%', tone: 'accent2', duration: 1090, delay: 240, drift: -12, size: 6 },
]

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const palette = useColors()
  const t = useSharedValue(0)
  useEffect(() => {
    // One fall, then done — no withRepeat. A looping burst re-captures
    // attention every cycle and would sit permanently over the card's message.
    t.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) })
    )
    return () => cancelAnimation(t)
  }, [t, piece])
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * t.value, // fade late, not linearly
    transform: [
      { translateY: fall * t.value },
      { translateX: piece.drift * Math.sin(t.value * Math.PI) },
      { rotate: `${420 * t.value}deg` },
    ],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -12,
          left: piece.left as any,
          width: piece.size,
          height: piece.size + 5,
          borderRadius: 1,
          backgroundColor: palette[piece.tone],
        },
        style,
      ]}
    />
  )
}

/**
 * A single celebration burst that cleans itself up.
 *
 * Remount with a fresh `key` to replay. It deliberately does not loop:
 * ambient motion running alongside content is both a WCAG 2.2.2 Level A
 * failure and the motion pattern that costs an attention-limited reader most.
 */
export default function Confetti({ fall = 220 }: { fall?: number }) {
  const reducedMotion = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reducedMotion) return
    const t = setTimeout(() => setDone(true), BURST_MS)
    return () => clearTimeout(t)
  }, [reducedMotion])

  if (reducedMotion || done) return null

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      {PIECES.map((p, i) => (
        <ConfettiPiece key={i} piece={p} fall={fall} />
      ))}
    </View>
  )
}
