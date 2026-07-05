import { useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

export default function DumpScreen() {
  const { inbox, addToInbox, removeTask } = useApp()
  const [draft, setDraft] = useState('')
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)

  const submit = () => {
    if (!draft.trim()) return
    addToInbox(draft)
    setDraft('')
    // keep the keyboard up — capture should be rapid-fire
    inputRef.current?.focus()
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1" style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <ScreenHeader
            title="Brain dump"
            subtitle="Empty your head. Don't organize — type, hit return, repeat. You'll sort it after."
          />

          <View
            className="bg-surface border border-soft flex-row items-center mt-3.5"
            style={{ borderRadius: 16, paddingVertical: 5, paddingLeft: 8, paddingRight: 6, gap: 8 }}
          >
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submit}
              blurOnSubmit={false}
              autoFocus
              placeholder="What's on your mind?"
              placeholderTextColor={palette.muted}
              returnKeyType="done"
              className="flex-1 font-hk400 text-ink text-[15px]"
              style={{ paddingVertical: 10, paddingHorizontal: 4 }}
            />
            <PressableScale
              haptic
              onPress={submit}
              className="bg-accent items-center justify-center"
              style={{ width: 38, height: 38, borderRadius: 12 }}
              accessibilityLabel="Add"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </PressableScale>
          </View>

          <Text className="font-hk600 text-muted text-[11px] mt-4" style={{ letterSpacing: 0.4 }}>
            {inbox.length} CAPTURED
          </Text>

          <ScrollView
            className="flex-1 mt-2"
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {inbox.map((item) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.duration(140)}
                exiting={FadeOut.duration(120)}
                layout={LinearTransition.duration(160)}
                className="bg-surface border border-soft flex-row items-center"
                style={{ borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, gap: 11 }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent }} />
                <Text className="flex-1 font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                  {item.title}
                </Text>
                <Pressable onPress={() => removeTask(item.id)} hitSlop={8} accessibilityLabel="Remove">
                  <Text className="text-muted" style={{ fontSize: 19, lineHeight: 20 }}>×</Text>
                </Pressable>
              </Animated.View>
            ))}
            {inbox.length === 0 && (
              <View className="items-center" style={{ paddingVertical: 24 }}>
                <Text className="font-hk400 text-muted text-[13px] text-center" style={{ lineHeight: 20 }}>
                  Head&apos;s clear.{'\n'}Add anything that&apos;s taking up space.
                </Text>
              </View>
            )}
          </ScrollView>

          {inbox.length > 0 && (
            <PressableScale
              haptic
              onPress={() => router.replace('/triage')}
              className="bg-accent items-center mt-3"
              style={{ borderRadius: 16, paddingVertical: 15 }}
            >
              <Text className="font-hk700 text-white text-[15px]">
                Sort these {inbox.length} →
              </Text>
            </PressableScale>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
