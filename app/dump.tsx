import { useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { CloseIcon, PlusIcon } from '@/components/ui/Icon'
import Group, { Divider } from '@/components/ui/Group'
import { useApp } from '@/store/AppStore'
import { MAX_TITLE } from '@/lib/tasks'
import { TITLE_SCALE, useColors } from '@/lib/theme'
import { useKeyboardPadding } from '@/lib/keyboard'

export default function DumpScreen() {
  const palette = useColors()
  const { inbox, addToInbox, removeTask } = useApp()
  const [draft, setDraft] = useState('')
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  // the keyboard stays up the whole time, so Sort has to sit above it
  const keyboard = useKeyboardPadding()

  const submit = () => {
    if (!draft.trim()) return
    addToInbox(draft)
    setDraft('')
    // keep the keyboard up — capture should be rapid-fire
    inputRef.current?.focus()
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1" style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 + keyboard }}>
        <ScreenHeader
          title="Brain dump"
          subtitle="Empty your head. No organizing yet: type, hit return, repeat. You'll sort it after."
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
            submitBehavior="submit"
            autoFocus
            maxLength={MAX_TITLE}
            placeholder="What's on your mind?"
            placeholderTextColor={palette.muted}
            returnKeyType="next"
            accessibilityLabel="What's on your mind?"
            className="flex-1 font-hk400 text-ink text-body"
            style={{ paddingVertical: 11, paddingHorizontal: 6 }}
            // past twice its size the field and Sort can't both stay above the keyboard
            maxFontSizeMultiplier={TITLE_SCALE}
          />
          <PressableScale
            haptic
            onPress={submit}
            className="bg-accent items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 13 }}
            accessibilityLabel="Add"
          >
            <PlusIcon />
          </PressableScale>
        </View>

        <Text className="font-hk600 text-muted text-footnote" style={{ marginTop: 18 }}>
          {inbox.length} captured
        </Text>

        <ScrollView
          showsHorizontalScrollIndicator={false}
          className="flex-1 mt-2"
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {inbox.length > 0 && (
            <Group>
              {inbox.map((item, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.duration(140)}
                  exiting={FadeOut.duration(120)}
                  layout={LinearTransition.duration(160)}
                >
                  {i > 0 && <Divider inset={35} />}
                  <View
                    className="flex-row items-center"
                    style={{ paddingLeft: 16, paddingRight: 14, paddingVertical: 13, gap: 12 }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent }} />
                    <Text className="flex-1 font-hk500 text-ink text-body">{item.title}</Text>
                    <Pressable
                      onPress={() => removeTask(item.id)}
                      hitSlop={14}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.title}`}
                    >
                      <CloseIcon size={16} />
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </Group>
          )}
          {inbox.length === 0 && (
            <View className="items-center" style={{ paddingVertical: 24 }}>
              <Text className="font-hk400 text-muted text-subhead text-center" style={{ lineHeight: 22 }}>
                Head&apos;s clear.{'\n'}Add anything that&apos;s taking up space.
              </Text>
            </View>
          )}
        </ScrollView>

        {inbox.length > 0 && (
          <PressableScale
            haptic
            onPress={() => router.replace('/triage')}
            className="bg-accent items-center justify-center mt-3"
            style={{ borderRadius: 18, paddingVertical: 16 }}
          >
            <Text className="font-hk700 text-on-accent text-headline" maxFontSizeMultiplier={TITLE_SCALE}>
              Sort {inbox.length === 1 ? 'this' : `these ${inbox.length}`}
            </Text>
          </PressableScale>
        )}
      </View>
    </SafeAreaView>
  )
}
