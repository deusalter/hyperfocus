import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Cat, CAT_ORDER, CATS, hexA } from '@/lib/theme'
import { CatIcon } from '@/components/CatTag'

const COLLAPSE_AFTER_MS = 260

function Chip({
  cat,
  selected,
  onPress,
  index,
}: {
  cat: Cat
  selected: boolean
  onPress: () => void
  index: number
}) {
  const meta = CATS[cat]
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityState={{ selected }}>
      <Animated.View
        entering={FadeIn.duration(120).delay(index * 35)}
        className="flex-row items-center rounded-[9px]"
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          gap: 5,
          backgroundColor: selected ? meta.color : hexA(meta.color, 0.12),
        }}
      >
        <CatIcon cat={cat} color={selected ? '#fff' : meta.color} />
        <Text
          className="font-hk800 text-[11px]"
          style={{ color: selected ? '#fff' : meta.color, letterSpacing: 0.2 }}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

/**
 * Tap the current category tag and it unfolds into all three choices —
 * pick directly instead of blind-cycling. Collapses after selection.
 */
export default function CatPicker({
  value,
  onChange,
}: {
  value: Cat
  onChange: (cat: Cat) => void
}) {
  const [open, setOpen] = useState(false)

  const select = (cat: Cat) => {
    Haptics.selectionAsync().catch(() => {})
    if (cat !== value) onChange(cat)
    // linger just long enough to see the fill land
    setTimeout(() => setOpen(false), COLLAPSE_AFTER_MS)
  }

  if (open) {
    return (
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {CAT_ORDER.map((cat, i) => (
          <Chip key={cat} cat={cat} index={i} selected={cat === value} onPress={() => select(cat)} />
        ))}
      </View>
    )
  }

  const meta = CATS[value]
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {})
        setOpen(true)
      }}
      hitSlop={10}
      className="flex-row items-center"
      style={{ gap: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`Category ${meta.label}, tap to change`}
    >
      {/* keyed on value so a fresh pick lands with a small pop */}
      <Animated.View
        key={value}
        entering={ZoomIn.duration(160)}
        className="flex-row items-center rounded-[9px]"
        style={{
          paddingHorizontal: 9,
          paddingVertical: 4,
          gap: 5,
          backgroundColor: hexA(meta.color, 0.13),
        }}
      >
        <CatIcon cat={value} />
        <Text className="font-hk800 text-[11px]" style={{ color: meta.color, letterSpacing: 0.2 }}>
          {meta.label}
        </Text>
      </Animated.View>
      <Text className="font-hk400 text-muted text-[10px]">tap to change</Text>
    </Pressable>
  )
}
