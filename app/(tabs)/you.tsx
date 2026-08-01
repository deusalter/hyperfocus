import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import Sprite from '@/components/Sprite'
import Toggle from '@/components/ui/Toggle'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

const FOCUS_OPTIONS = [15, 25, 45]

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="font-hk700 text-muted text-[11px]"
      style={{ letterSpacing: 0.4, marginTop: 20, marginBottom: 8, marginHorizontal: 4 }}
    >
      {children}
    </Text>
  )
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
  last,
  soon,
}: {
  title: string
  subtitle: string
  on: boolean
  onToggle: () => void
  last?: boolean
  /** not wired up yet — say so rather than offer a switch that does nothing */
  soon?: boolean
}) {
  return (
    <Pressable
      onPress={soon ? undefined : onToggle}
      disabled={soon}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: soon }}
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.soft,
      }}
    >
      <View className="flex-1">
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <Text
            className="font-hk700 text-[14.5px]"
            style={{ color: soon ? palette.muted : palette.ink }}
          >
            {title}
          </Text>
          {soon && (
            <View
              className="bg-accent-soft rounded-full"
              style={{ paddingHorizontal: 7, paddingVertical: 2 }}
            >
              <Text className="font-hk700 text-accent text-[9.5px]">SOON</Text>
            </View>
          )}
        </View>
        <Text className="font-hk400 text-muted text-[12px] mt-0.5">{subtitle}</Text>
      </View>
      <View style={{ opacity: soon ? 0.4 : 1 }}>
        <Toggle on={on} />
      </View>
    </Pressable>
  )
}

export default function YouScreen() {
  const router = useRouter()
  const { settings, updateSettings, showedUp, companionLevel, resetAll } = useApp()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(260)}>
          <Text className="font-hk800 text-ink text-[24px]" style={{ letterSpacing: -0.5 }}>
            You
          </Text>
        </Animated.View>

        {/* profile card */}
        <Animated.View
          entering={FadeInUp.delay(40).duration(260)}
          className="bg-surface border border-soft items-center mt-4"
          style={{ borderRadius: 20, paddingVertical: 18, paddingHorizontal: 16 }}
        >
          <Sprite pose="idle" level={companionLevel} />
          <Text className="font-hk800 text-ink text-[20px] mt-1" style={{ letterSpacing: -0.3 }}>
            {settings.name.trim() || 'Friend'}
          </Text>
          <View className="flex-row mt-2.5" style={{ gap: 8 }}>
            <View className="bg-accent-soft rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text className="font-hk700 text-accent text-[12px]">Level {companionLevel}</Text>
            </View>
            {!settings.gentle && showedUp > 0 && (
              <View className="bg-accent-soft rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text className="font-hk700 text-accent text-[12px]">
                  {showedUp} days this month
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(260)}>
          <SectionLabel>FOCUS</SectionLabel>
          <View className="bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text className="font-hk700 text-ink text-[14px]">Default session length</Text>
            <View className="flex-row mt-2.5" style={{ gap: 8 }}>
              {FOCUS_OPTIONS.map((n) => {
                const active = settings.focusLen === n
                return (
                  <Pressable
                    key={n}
                    onPress={() => updateSettings({ focusLen: n })}
                    className="flex-1 items-center"
                    style={{
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? palette.accent : palette.soft,
                      backgroundColor: active ? palette.accent : palette.surface,
                    }}
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      className="font-hk700 text-[14px]"
                      style={{ color: active ? '#fff' : palette.ink }}
                    >
                      {n}m
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <SectionLabel>INTEGRATIONS</SectionLabel>
          <View
            className="bg-surface border border-soft flex-row items-center"
            style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}
          >
            <View
              className="bg-accent-soft items-center justify-center"
              style={{ width: 38, height: 38, borderRadius: 11 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
                  stroke={palette.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
            <View className="flex-1">
              <Text className="font-hk700 text-ink text-[14.5px]">Canvas</Text>
              <Text className="font-hk400 text-muted text-[12px] mt-0.5">
                Import your assignments automatically
              </Text>
            </View>
            <View className="bg-accent-soft rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text className="font-hk700 text-accent text-[11px]">Soon</Text>
            </View>
          </View>

          <SectionLabel>PREFERENCES</SectionLabel>
          <View className="bg-surface border border-soft" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <ToggleRow
              title="Gentle mode"
              subtitle="Hide streak pressure"
              on={settings.gentle}
              onToggle={() => updateSettings({ gentle: !settings.gentle })}
            />
            <ToggleRow
              soon
              title="Gentle reminders"
              subtitle="A nudge, never a nag"
              on={settings.reminders}
              onToggle={() => updateSettings({ reminders: !settings.reminders })}
            />
            <ToggleRow
              soon
              title="Focus sounds"
              subtitle="Soft ambience while focusing"
              on={settings.sounds}
              onToggle={() => updateSettings({ sounds: !settings.sounds })}
              last
            />
          </View>

          <View className="bg-surface border border-soft mt-3" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Pressable
              onPress={() => router.push('/onboarding')}
              className="flex-row items-center"
              style={{
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: palette.soft,
              }}
            >
              <Text className="flex-1 font-hk600 text-ink text-[14.5px]">Replay welcome</Text>
              <Text className="text-muted text-[18px]">›</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Reset everything?',
                  'Every task, session, and streak will be permanently removed.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete all', style: 'destructive', onPress: resetAll },
                  ]
                )
              }
              className="flex-row items-center"
              style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Text className="flex-1 font-hk600 text-[14.5px]" style={{ color: palette.dangerText }}>
                Reset everything
              </Text>
              <Text className="text-muted text-[18px]">›</Text>
            </Pressable>
          </View>

          <Text className="font-hk400 text-muted text-center text-[11.5px]" style={{ marginTop: 22 }}>
            Hyperfocus · v2.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
