import { ReactNode } from 'react'
import { Pressable, PressableProps, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

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
        scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 })
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
