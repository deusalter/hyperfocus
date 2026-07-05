import { View, Text, Pressable } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Rect, Circle } from 'react-native-svg'
import { palette } from '@/lib/theme'
import PressableScale from '@/components/ui/PressableScale'

function TabGlyph({ name, color }: { name: string; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (name) {
    case 'index':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M3 10.5 12 3l9 7.5" {...stroke} />
          <Path d="M5 9.5V21h14V9.5" {...stroke} />
        </Svg>
      )
    case 'calendar':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Rect x={3} y={5} width={18} height={16} rx={2.5} {...stroke} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...stroke} />
        </Svg>
      )
    case 'insights':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M5 20V11M12 20V5M19 20v-6" {...stroke} />
        </Svg>
      )
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...stroke} />
        </Svg>
      )
  }
}

const LABELS: Record<string, string> = {
  index: 'Home',
  calendar: 'Calendar',
  insights: 'Insights',
  you: 'You',
}

export default function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const renderTab = (routeName: string, routeKey: string, index: number) => {
    const focused = state.index === index
    const color = focused ? palette.accent : palette.muted
    return (
      <Pressable
        key={routeKey}
        onPress={() => {
          if (!focused) {
            Haptics.selectionAsync().catch(() => {})
            navigation.navigate(routeName as never)
          }
        }}
        className="flex-1 items-center"
        style={{ gap: 3 }}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={LABELS[routeName]}
      >
        <TabGlyph name={routeName} color={color} />
        <Text className="font-hk700 text-[9.5px]" style={{ color }}>
          {LABELS[routeName]}
        </Text>
      </Pressable>
    )
  }

  const [home, calendar, insights, you] = state.routes

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 14),
      }}
    >
      <View
        style={{
          borderRadius: 28,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          shadowColor: '#141e2d',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
          overflow: 'visible',
        }}
      >
        <View style={{ borderRadius: 27, overflow: 'hidden' }}>
          <BlurView
            intensity={40}
            tint="light"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 9,
              paddingHorizontal: 14,
              backgroundColor: 'rgba(255,255,255,0.55)',
            }}
          >
            {renderTab(home.name, home.key, 0)}
            {renderTab(calendar.name, calendar.key, 1)}
            {/* spacer under the floating FAB */}
            <View style={{ width: 60 }} />
            {renderTab(insights.name, insights.key, 2)}
            {renderTab(you.name, you.key, 3)}
          </BlurView>
        </View>

        {/* capture FAB — floats above the glass */}
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, top: -22, alignItems: 'center' }}
        >
          <PressableScale
            haptic
            scaleTo={0.9}
            onPress={() => router.push('/dump')}
            accessibilityLabel="Brain dump"
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: palette.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: 'rgba(255,255,255,0.85)',
              shadowColor: palette.accent,
              shadowOpacity: 0.32,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          </PressableScale>
        </View>
      </View>
    </View>
  )
}
