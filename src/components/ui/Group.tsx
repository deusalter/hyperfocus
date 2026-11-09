import { ReactNode } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useColors } from '@/lib/theme'

/**
 * Related rows in one container, split by hairlines, the way iOS groups a list.
 * A separate card for every row made a screen of equal boxes where nothing stood
 * out, so cards are for things that stand alone and lists live in a Group.
 */
export default function Group({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View
      className="bg-surface border border-soft"
      style={[{ borderRadius: 20, overflow: 'hidden' }, style]}
    >
      {children}
    </View>
  )
}

/** The line between two rows of a Group, starting where the row's text does. */
export function Divider({ inset = 16 }: { inset?: number }) {
  const palette = useColors()
  return (
    <View
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.soft, marginLeft: inset }}
    />
  )
}
