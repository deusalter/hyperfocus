import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '@/lib/theme'

interface Piece {
  left: string
  color: string
  duration: number
  delay: number
  /** horizontal drift while falling, px */
  drift: number
  size: number
}

const PIECES: Piece[] = [
  { left: '8%', color: palette.accent, duration: 1300, delay: 0, drift: 14, size: 7 },
  { left: '20%', color: palette.accent2, duration: 1500, delay: 250, drift: -10, size: 6 },
  { left: '34%', color: palette.accent, duration: 1200, delay: 400, drift: 8, size: 8 },
  { left: '47%', color: palette.accent2, duration: 1450, delay: 100, drift: -16, size: 7 },
  { left: '60%', color: palette.accent, duration: 1350, delay: 320, drift: 12, size: 6 },
  { left: '72%', color: palette.accent2, duration: 1250, delay: 180, drift: -8, size: 8 },
  { left: '84%', color: palette.accent, duration: 1400, delay: 60, drift: 15, size: 7 },
  { left: '93%', color: palette.accent2, duration: 1320, delay: 420, drift: -12, size: 6 },
]

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withRepeat(withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) }), -1)
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
          top: -10,
          left: piece.left as any,
          width: piece.size,
          height: piece.size + 5,
          borderRadius: 1,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  )
}

/** Gentle looping confetti — absolutely fills its parent. */
export default function Confetti({ fall = 220 }: { fall?: number }) {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {PIECES.map((p, i) => (
        <ConfettiPiece key={i} piece={p} fall={fall} />
      ))}
    </View>
  )
}
