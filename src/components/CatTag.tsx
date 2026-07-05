import { View, Text } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Cat, CATS, hexA } from '@/lib/theme'

// exact glyphs from the design system
const ICON_PATHS: Record<Cat, string> = {
  sprint: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  fire: 'M12 2c1 4-2 5-3 8 0 0-2-1-2-3-2 2-3.2 4-3.2 7a8.2 8.2 0 0 0 16.4 0c0-4-3-6.5-4-9.5-1 2-2 2.2-3 1.2 1-4-1-6-1.2-3.7z',
  grind: 'M2 20 9 7l3.5 6 2.2-3.5L22 20z',
}

export function CatIcon({ cat, size = 12, color }: { cat: Cat; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICON_PATHS[cat]} fill={color ?? CATS[cat].color} />
    </Svg>
  )
}

export default function CatTag({
  cat,
  showLabel = true,
}: {
  cat: Cat
  showLabel?: boolean
}) {
  const meta = CATS[cat]
  return (
    <View
      className="flex-row items-center rounded-[9px]"
      style={{
        backgroundColor: hexA(meta.color, 0.13),
        paddingHorizontal: showLabel ? 9 : 7,
        paddingVertical: showLabel ? 4 : 6,
        gap: 5,
        alignSelf: 'flex-start',
      }}
    >
      <CatIcon cat={cat} />
      {showLabel && (
        <Text
          className="font-hk800 text-[11px]"
          style={{ color: meta.color, letterSpacing: 0.2 }}
        >
          {meta.label}
        </Text>
      )}
    </View>
  )
}
