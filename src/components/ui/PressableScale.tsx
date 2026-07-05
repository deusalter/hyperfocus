import { ReactNode } from 'react'
import { Pressable, PressableProps, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { SNAP, TAP } from '@/lib/motion'

interface Props extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: ViewStyle | ViewStyle[]
  className?: string
  haptic?: boolean
  scaleTo?: number
}

/** Pressable with a springy shrink — the app's standard touch feedback. */
export default function PressableScale({
  children,
  style,
  className,
  haptic = false,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, TAP)
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, SNAP)
        onPressOut?.(e)
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress?.(e)
      }}
      {...rest}
    >
      <Animated.View className={className} style={[animated, style]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
