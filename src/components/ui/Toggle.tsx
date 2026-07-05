import { useEffect } from 'react'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '@/lib/theme'
import { SNAP } from '@/lib/motion'

/** The design's 46×27 pill toggle with a springy knob. Wrap in a Pressable row. */
export default function Toggle({ on }: { on: boolean }) {
  const t = useSharedValue(on ? 1 : 0)
  useEffect(() => {
    t.value = withTiming(on ? 1 : 0, { duration: 180 })
  }, [on, t])

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [palette.soft, palette.accent]),
  }))
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(on ? 19 : 0, SNAP) }],
  }))

  return (
    <Animated.View
      style={[{ width: 46, height: 27, borderRadius: 14, justifyContent: 'center' }, track]}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
    >
      <Animated.View
        style={[
          {
            width: 21,
            height: 21,
            borderRadius: 11,
            backgroundColor: '#fff',
            marginLeft: 3,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          },
          knob,
        ]}
      />
    </Animated.View>
  )
}
