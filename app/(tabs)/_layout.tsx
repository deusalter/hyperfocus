import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GlassTabBar from '@/components/GlassTabBar'
import UndoToast from '@/components/UndoToast'
import { palette } from '@/lib/theme'

/** Tab bar height plus the FAB's rise, so the toast clears both. */
const TOAST_CLEARANCE = 92

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: palette.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
        <Tabs.Screen name="you" options={{ title: 'You' }} />
      </Tabs>
      <UndoToast bottom={Math.max(insets.bottom, 14) + TOAST_CLEARANCE} />
    </View>
  )
}
