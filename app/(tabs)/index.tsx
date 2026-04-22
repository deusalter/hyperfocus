import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Greeting from '@/components/dashboard/Greeting'
import ShadowRace from '@/components/dashboard/ShadowRace'
import QuickCapture from '@/components/dashboard/QuickCapture'
import TodayList from '@/components/dashboard/TodayList'

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-5 pt-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Greeting />
        <ShadowRace />
        <QuickCapture />
        <TodayList />
      </ScrollView>
    </SafeAreaView>
  )
}
