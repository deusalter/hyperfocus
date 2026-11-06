import { ReactNode } from 'react'
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
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
 *
 * Accessibility belongs to the outer node for the same reason. Marked accessible,
 * it groups its children and builds its label from their text, so a screen reader
 * hears "Pause, button". Left on the overlay, which has no children of its own,
 * every button in the app read as an unnamed "button" with loose text beside it.
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
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  ...rest
}: Props) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const fire = (e: GestureResponderEvent) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onPress?.(e)
  }

  return (
    <Animated.View
      className={className}
      style={[style, animated, disabled ? { opacity: 0.4 } : null]}
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? undefined}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      // VoiceOver activates through onAccessibilityTap. TalkBack has no such thing
      // and needs the view to declare an activate action instead.
      {...(Platform.OS === 'android'
        ? {
            accessibilityActions: [{ name: 'activate' }],
            onAccessibilityAction: () => {
              if (!disabled) fire({} as GestureResponderEvent)
            },
          }
        : {
            onAccessibilityTap: disabled ? undefined : () => fire({} as GestureResponderEvent),
          })}
    >
      {children}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
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
        onPress={fire}
        {...rest}
      />
    </Animated.View>
  )
}
