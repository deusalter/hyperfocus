import { ReactNode } from 'react'
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { SNAP, TAP } from '@/lib/motion'

interface Props extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  className?: string
  haptic?: boolean
  scaleTo?: number
}

/**
 * Pressable with a quiet shrink — the app's standard touch feedback.
 *
 * The visual + layout node is the Animated.View, so `flex-1` and friends
 * size the element callers actually laid out. (Previously className landed
 * on an inner wrapper, so every button row collapsed to its text width.)
 * Touch is captured by a transparent overlay covering the full border box —
 * padding included — which keeps the tap target the size it looks.
 */
export default function PressableScale({
  children,
  style,
  className,
  haptic = false,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View
      className={className}
      style={[style, animated, disabled ? { opacity: 0.4 } : null]}
    >
      {children}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={StyleSheet.absoluteFill}
        onPressIn={(e) => {
          if (!reduced) scale.value = withTiming(scaleTo, TAP)
          onPressIn?.(e)
        }}
        onPressOut={(e) => {
          if (!reduced) scale.value = withTiming(1, SNAP)
          onPressOut?.(e)
        }}
        onPress={(e) => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          onPress?.(e)
        }}
        {...rest}
      />
    </Animated.View>
  )
}
