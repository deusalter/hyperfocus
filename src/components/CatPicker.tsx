import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { CATS, CAT_ORDER, Cat, hexA, useColors } from '@/lib/theme'
import { CatIcon } from '@/components/CatTag'
import { ChevronDown } from '@/components/ui/Icon'

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
  const palette = useColors()
  const meta = CATS[cat]
  const tone = palette.cats[cat]
  return (
    // Chips sit 6px apart, so horizontal slop is capped at half the gap —
    // overlapping hit regions resolve unpredictably and would make the
    // neighbouring category win some taps. Vertical slop carries it to 44pt.
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 11, bottom: 11, left: 3, right: 3 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View
        entering={FadeIn.duration(120).delay(index * 35)}
        className="flex-row items-center rounded-[9px]"
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          gap: 5,
          // selected fills with the darker tone: white on the vivid fill sits
          // at 3.8:1 for sprint, which is under AA for an 11px label
          backgroundColor: selected ? tone.textColor : hexA(tone.color, 0.12),
        }}
      >
        <CatIcon cat={cat} color={selected ? palette.onAccent : tone.color} />
        <Text
          className="font-hk800 text-[11px]"
          style={{ color: selected ? palette.onAccent : tone.textColor, letterSpacing: 0.2 }}
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
  const palette = useColors()
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
  const tone = palette.cats[value]
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {})
        setOpen(true)
      }}
      hitSlop={12}
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
          backgroundColor: hexA(tone.color, 0.13),
        }}
      >
        <CatIcon cat={value} />
        <Text className="font-hk800 text-[11px]" style={{ color: tone.textColor, letterSpacing: 0.2 }}>
          {meta.label}
        </Text>
        {/* a caret carries "this opens" without a sentence repeated on every
            row — instructional text that never goes away is just clutter */}
        <ChevronDown size={10} color={tone.textColor} strokeWidth={3} />
      </Animated.View>
    </Pressable>
  )
}
