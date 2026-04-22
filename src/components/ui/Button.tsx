import { Pressable, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  accessibilityLabel?: string
}

const variantClasses = {
  primary: 'bg-accent border-accent',
  secondary: 'bg-surface border-border',
  ghost: 'bg-transparent border-transparent',
  danger: 'bg-transparent border-danger/40',
}

const variantTextClasses = {
  primary: 'text-accent-ink',
  secondary: 'text-foreground',
  ghost: 'text-muted',
  danger: 'text-danger',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3.5 rounded-xl',
}

const sizeTextClasses = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  accessibilityLabel,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled) return
    // Lightweight tactile confirmation — ADHD brains respond to feedback.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      className={cn(
        'border flex-row items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className
      )}
      style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.82 : disabled ? 0.5 : 1 })}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn('font-medium', variantTextClasses[variant], sizeTextClasses[size])}
        >
          {children}
        </Text>
      ) : (
        <View className="flex-row items-center justify-center gap-2">{children}</View>
      )}
    </Pressable>
  )
}
