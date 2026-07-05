import { useEffect, useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { GLIDE } from '@/lib/motion'
import Svg, { Path, Rect, Circle } from 'react-native-svg'
import { palette, hexA } from '@/lib/theme'
import PressableScale from '@/components/ui/PressableScale'

const H_PAD = 14
const FAB_GAP = 60

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

/** Row content shared by the iOS blur path and the Android solid path. */
function BarContent({
  state,
  navigation,
  barW,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & { barW: number }) {
  const tabW = barW > 0 ? (barW - H_PAD * 2 - FAB_GAP) / 4 : 0

  // the "lens" that glides under the active tab — smooth, no bounce
  const lensX = useSharedValue(0)
  useEffect(() => {
    if (tabW <= 0) return
    const i = state.index
    lensX.value = withTiming(H_PAD + i * tabW + (i >= 2 ? FAB_GAP : 0), GLIDE)
  }, [state.index, tabW, lensX])
  const lensStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lensX.value }] }))

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
        style={{ gap: 3, paddingVertical: 9 }}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD }}>
      {tabW > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: 0,
              width: tabW,
              borderRadius: 18,
              backgroundColor: hexA(palette.accent, 0.1),
            },
            lensStyle,
          ]}
        />
      )}
      {renderTab(home.name, home.key, 0)}
      {renderTab(calendar.name, calendar.key, 1)}
      <View style={{ width: FAB_GAP }} />
      {renderTab(insights.name, insights.key, 2)}
      {renderTab(you.name, you.key, 3)}
    </View>
  )
}

export default function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [barW, setBarW] = useState(0)

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
        onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
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
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={40}
              tint="light"
              style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
            >
              <BarContent state={state} navigation={navigation} barW={barW} />
            </BlurView>
          ) : (
            // Android: blur is unreliable — near-opaque glass reads the same
            <View style={{ backgroundColor: 'rgba(255,255,255,0.94)' }}>
              <BarContent state={state} navigation={navigation} barW={barW} />
            </View>
          )}
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
