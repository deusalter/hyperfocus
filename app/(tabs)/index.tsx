import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-5 pt-4">
        <Text className="text-foreground text-3xl font-bold">Today</Text>
        <Text className="text-muted text-sm mt-1">Dashboard coming in the UI rebuild pass.</Text>
      </View>
    </SafeAreaView>
  )
}
