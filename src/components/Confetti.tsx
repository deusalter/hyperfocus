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
}

const PIECES: Piece[] = [
  { left: '14%', color: palette.accent, duration: 1300, delay: 0 },
  { left: '30%', color: palette.accent2, duration: 1500, delay: 250 },
  { left: '46%', color: palette.accent, duration: 1200, delay: 400 },
  { left: '62%', color: palette.accent2, duration: 1450, delay: 100 },
  { left: '78%', color: palette.accent, duration: 1350, delay: 320 },
  { left: '90%', color: palette.accent2, duration: 1250, delay: 180 },
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
    opacity: 1 - t.value,
    transform: [{ translateY: fall * t.value }, { rotate: `${420 * t.value}deg` }],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -10,
          left: piece.left as any,
          width: 7,
          height: 12,
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
