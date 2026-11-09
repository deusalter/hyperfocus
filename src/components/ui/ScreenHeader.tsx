import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ReactNode } from 'react'
import { ChevronLeft, CloseIcon } from '@/components/ui/Icon'
import { goBackOrHome } from '@/lib/nav'
import { TITLE_SCALE } from '@/lib/theme'

/**
 * Flow header: back or close control + title + optional right slot + subtitle.
 * Sheets get a close mark and pushed screens a chevron, which is how iOS tells
 * you which way you'll travel when you tap it.
 */
export default function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  variant = 'close',
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
  variant?: 'back' | 'close'
}) {
  const router = useRouter()
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Pressable
          onPress={onBack ?? (() => goBackOrHome(router))}
          // the glyph is ~24pt, so slop carries the target to 44pt without
          // moving the title
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={variant === 'close' ? 'Close' : 'Back'}
          style={{ marginLeft: -3 }}
        >
          {variant === 'close' ? <CloseIcon size={24} /> : <ChevronLeft size={24} />}
        </Pressable>
        <Text
          className="font-hk800 text-ink text-title2"
          maxFontSizeMultiplier={TITLE_SCALE}
          style={{ letterSpacing: -0.4 }}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {right && <View className="ml-auto">{right}</View>}
      </View>
      {subtitle && (
        <Text
          className="font-hk400 text-muted text-footnote mt-1.5"
          // past twice its size it pushed the Brain dump's field under the keyboard
          maxFontSizeMultiplier={TITLE_SCALE}
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}
