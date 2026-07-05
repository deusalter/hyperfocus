import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ReactNode } from 'react'

/** Modal-flow header: back chevron + title + optional right slot + subtitle. */
export default function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
}) {
  const router = useRouter()
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Pressable
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          hitSlop={12}
          accessibilityLabel="Back"
        >
          <Text className="text-muted" style={{ fontSize: 26, lineHeight: 28, marginTop: -2 }}>
            ‹
          </Text>
        </Pressable>
        <Text className="font-hk800 text-ink text-[22px]" style={{ letterSpacing: -0.4 }}>
          {title}
        </Text>
        {right && <View className="ml-auto">{right}</View>}
      </View>
      {subtitle && (
        <Text className="font-hk400 text-muted text-[12.5px] mt-1" style={{ lineHeight: 18 }}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}
