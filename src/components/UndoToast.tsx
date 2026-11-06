import { useEffect } from 'react'
import { AccessibilityInfo, Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/native'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

// the accent, lifted until it clears AA against the toast's ink background
const UNDO_COLOR = '#a9c8e8'

/**
 * A way back from anything quick. Checking something off by accident and letting
 * go of the wrong task are both one tap away, and an impulsive tap shouldn't cost
 * anything. Offering undo beats asking "are you sure?" every time, which would add
 * a decision to every action to protect against a rare mistake.
 *
 * Each screen that can trigger one renders its own: a native modal sits above the
 * root view, so a single toast at the root would be hidden behind the sheet.
 */
export default function UndoToast({ bottom = 20 }: { bottom?: number }) {
  const { undoOffer, undo } = useApp()
  const focused = useIsFocused()
  const id = undoOffer?.id
  const message = undoOffer?.message

  useEffect(() => {
    if (focused && message) AccessibilityInfo.announceForAccessibility(`${message}. Undo available.`)
  }, [focused, message, id])

  if (!undoOffer || !focused) return null

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 16, right: 16, bottom, alignItems: 'center' }}
    >
      <Animated.View
        key={undoOffer.id}
        entering={FadeInDown.duration(160)}
        exiting={FadeOutDown.duration(120)}
        className="flex-row items-center"
        style={{
          backgroundColor: palette.ink,
          borderRadius: 14,
          paddingLeft: 16,
          paddingRight: 6,
          minHeight: 48,
          gap: 8,
          maxWidth: 420,
          width: '100%',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Text
          className="flex-1 font-hk600 text-white text-[14px]"
          numberOfLines={1}
          maxFontSizeMultiplier={1.4}
        >
          {undoOffer.message}
        </Text>
        <Pressable
          onPress={undo}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={{ paddingHorizontal: 12, paddingVertical: 13 }}
        >
          <Text
            className="font-hk800 text-[14px]"
            style={{ color: UNDO_COLOR }}
            maxFontSizeMultiplier={1.4}
          >
            Undo
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}
