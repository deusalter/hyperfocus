import { useState } from 'react'
import { View, Text, Pressable, Alert, ScrollView, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Trash2 } from 'lucide-react-native'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Settings } from '@/lib/types'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const defaults: Settings = {
  theme: 'dark',
  defaultFocusDuration: 25,
  soundEnabled: true,
}

export default function SettingsScreen() {
  const [settings, setSettings] = useLocalStorage<Settings>('hyperfocus-settings', defaults)
  const [confirming, setConfirming] = useState(false)

  const resetAll = async () => {
    await AsyncStorage.multiRemove([
      'hyperfocus-tasks',
      'hyperfocus-sessions',
      'hyperfocus-settings',
    ])
    Alert.alert('Reset', 'All data cleared. Restart the app to see changes.')
    setConfirming(false)
  }

  const durations = [15, 25, 30, 45, 60]

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pt-4 pb-8">
        <View className="mb-8">
          <Text
            className="text-foreground text-[40px] leading-tight"
            style={{ fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: -0.5 }}
          >
            Settings<Text className="text-accent">.</Text>
          </Text>
          <Text className="text-muted text-sm mt-1">Fewer knobs is the feature.</Text>
        </View>

        <View className="border-y border-border">
          {/* Sound */}
          <View className="flex-row items-center justify-between py-5 border-b border-border">
            <View>
              <Text className="text-foreground text-[15px] font-medium">Sound</Text>
              <Text className="text-muted text-xs mt-0.5">
                {settings.soundEnabled ? 'On' : 'Off'}
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(v) => setSettings({ ...settings, soundEnabled: v })}
              trackColor={{ false: '#1f1f28', true: '#c5f82a' }}
              thumbColor="#0a0d00"
              ios_backgroundColor="#1f1f28"
            />
          </View>

          {/* Default focus duration */}
          <View className="py-5 border-b border-border">
            <Text className="text-foreground text-[15px] font-medium mb-0.5">
              Default focus duration
            </Text>
            <Text className="text-muted text-xs font-mono tabular-nums mb-3">
              {settings.defaultFocusDuration} minutes
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {durations.map((m) => {
                const active = settings.defaultFocusDuration === m
                return (
                  <Pressable
                    key={m}
                    onPress={() => setSettings({ ...settings, defaultFocusDuration: m })}
                    className={cn(
                      'px-3 py-1.5 rounded-full border',
                      active ? 'border-accent' : 'border-border'
                    )}
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      className={cn(
                        'text-sm font-mono tabular-nums',
                        active ? 'text-accent' : 'text-muted'
                      )}
                    >
                      {m}m
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Reset data */}
          <View className="flex-row items-center justify-between py-5">
            <View className="flex-1">
              <Text className="text-foreground text-[15px] font-medium">Reset everything</Text>
              <Text className="text-muted text-xs mt-0.5">
                Tasks, sessions, settings — gone.
              </Text>
            </View>
            <Button
              variant="danger"
              size="sm"
              onPress={() =>
                Alert.alert(
                  'Sure?',
                  'Every task, session, and streak will be permanently removed.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete all', style: 'destructive', onPress: resetAll },
                  ]
                )
              }
              accessibilityLabel="Reset all data"
            >
              <Trash2 size={14} color="#f87171" />
              <Text className="text-danger font-medium text-sm">Reset</Text>
            </Button>
          </View>
        </View>

        <Text className="text-muted text-[10px] font-mono text-center mt-10">v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
