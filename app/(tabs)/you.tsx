import { ReactNode, useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { formatDistanceToNow } from 'date-fns'
import Sprite from '@/components/Sprite'
import Toggle from '@/components/ui/Toggle'
import PressableScale from '@/components/ui/PressableScale'
import { ChevronRight, SyncIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { isCanvasUrl } from '@/lib/feed'
import { PRIVACY_URL, SUPPORT_URL } from '@/lib/links'
import { notificationsAllowed, requestNotifications } from '@/lib/notifications'
import { REMINDER_HOURS } from '@/lib/reminders'
import { FOCUS_OPTIONS } from '@/lib/session'
import { SOUNDS, SOUND_ORDER, previewSound } from '@/lib/sound'
import { TITLE_SCALE, useColors } from '@/lib/theme'
import { SoundKind } from '@/lib/types'

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="font-hk700 text-muted text-footnote"
      style={{ marginTop: 26, marginBottom: 8, marginHorizontal: 4 }}
      accessibilityRole="header"
    >
      {children}
    </Text>
  )
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View className="bg-surface border border-soft" style={[{ borderRadius: 20 }, style]}>
      {children}
    </View>
  )
}

/** A row of equal choices, one selected. */
function Segments<T extends string | number>({
  options,
  value,
  onChange,
  groupLabel,
}: {
  options: { value: T; label: string; a11y?: string }[]
  value: T
  onChange: (next: T) => void
  groupLabel: string
}) {
  const palette = useColors()
  return (
    <View
      className="flex-row"
      style={{ gap: 8 }}
      accessibilityRole="radiogroup"
      accessibilityLabel={groupLabel}
    >
      {options.map((o) => {
        const active = value === o.value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className="flex-1 items-center"
            style={{
              paddingVertical: 11,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: active ? palette.accent : palette.soft,
              backgroundColor: active ? palette.accent : palette.surface,
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            accessibilityLabel={o.a11y ?? o.label}
          >
            <Text
              className="font-hk700 text-subhead"
              numberOfLines={1}
              style={{ color: active ? palette.onAccent : palette.ink }}
              maxFontSizeMultiplier={1.3}
            >
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
  last,
}: {
  title: string
  subtitle: string
  on: boolean
  onToggle: () => void
  last?: boolean
}) {
  const palette = useColors()
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
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
        <Text className="font-hk700 text-ink text-body">{title}</Text>
        <Text className="font-hk400 text-muted text-footnote mt-0.5">
          {subtitle}
        </Text>
      </View>
      <Toggle on={on} />
    </Pressable>
  )
}

function LinkRow({
  title,
  onPress,
  danger,
  last,
  hint,
}: {
  title: string
  onPress: () => void
  danger?: boolean
  last?: boolean
  hint?: string
}) {
  const palette = useColors()
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center"
      accessibilityRole="button"
      accessibilityHint={hint}
      style={{
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.soft,
      }}
    >
      <Text
        className="flex-1 font-hk600 text-body"
        style={{ color: danger ? palette.dangerText : palette.ink }}
      >
        {title}
      </Text>
      <ChevronRight />
    </Pressable>
  )
}

const FEED_ERRORS = {
  invalid: "That doesn't look like a calendar link. It should start with https or webcal.",
  unreachable: "Couldn't reach that link. Check your connection and that the link is complete.",
  'not-a-calendar': "That link opened, but it isn't a calendar feed.",
} as const

function FeedCard() {
  const palette = useColors()
  const { settings, feed, tasks, connectFeed, syncFeed, disconnectFeed } = useApp()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const url = settings.feedUrl
  const imported = tasks.filter((t) => t.source).length

  const connect = async () => {
    const ok = await connectFeed(draft)
    if (ok) {
      setDraft('')
      setOpen(false)
    }
  }

  const disconnect = () =>
    Alert.alert('Disconnect this calendar?', 'Anything already imported stays on your list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnectFeed },
    ])

  if (url) {
    return (
      <Card style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View
            className="bg-accent-soft items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 11 }}
          >
            <SyncIcon size={20} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="font-hk700 text-ink text-body">
              {isCanvasUrl(url) ? 'Canvas connected' : 'Calendar connected'}
            </Text>
            <Text className="font-hk400 text-muted text-footnote mt-0.5">
              {feed.syncing
                ? 'Checking now…'
                : settings.feedSyncedAt
                  ? `Checked ${formatDistanceToNow(settings.feedSyncedAt, { addSuffix: true })}`
                  : 'Not checked yet'}
              {imported > 0 ? ` · ${imported} on your list` : ''}
            </Text>
          </View>
        </View>
        {!feed.syncing && (feed.added ?? 0) + feed.moved > 0 && (
          <Text className="font-hk600 text-accent text-footnote mt-2.5">
            {(feed.added ?? 0) > 0 ? `Brought in ${feed.added} new. They're waiting in Later. ` : ''}
            {feed.moved > 0
              ? `${feed.moved} ${feed.moved === 1 ? 'deadline' : 'deadlines'} moved on the calendar, so the ${feed.moved === 1 ? 'date was' : 'dates were'} updated.`
              : ''}
          </Text>
        )}
        {feed.error && !feed.syncing && (
          <Text className="font-hk600 text-footnote mt-2.5" style={{ color: palette.dangerText }}>
            {FEED_ERRORS[feed.error]}
          </Text>
        )}
        <View className="flex-row mt-3" style={{ gap: 8 }}>
          <PressableScale
            onPress={() => syncFeed()}
            disabled={feed.syncing}
            className="flex-1 items-center bg-accent-soft"
            style={{ borderRadius: 11, paddingVertical: 10 }}
          >
            <Text className="font-hk700 text-accent text-footnote">Check now</Text>
          </PressableScale>
          <PressableScale
            onPress={disconnect}
            className="flex-1 items-center bg-surface border border-soft"
            style={{ borderRadius: 11, paddingVertical: 10 }}
          >
            <Text className="font-hk600 text-muted text-footnote">Disconnect</Text>
          </PressableScale>
        </View>
      </Card>
    )
  }

  return (
    <Card style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          className="bg-accent-soft items-center justify-center"
          style={{ width: 38, height: 38, borderRadius: 11 }}
        >
          <SyncIcon size={20} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="font-hk700 text-ink text-body">Canvas or calendar</Text>
          <Text className="font-hk400 text-muted text-footnote mt-0.5">
            Bring in what&apos;s due, without typing it.
          </Text>
        </View>
        {!open && (
          <PressableScale
            onPress={() => setOpen(true)}
            className="bg-accent-soft rounded-full"
            style={{ paddingHorizontal: 13, paddingVertical: 7 }}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text className="font-hk700 text-accent text-footnote">Connect</Text>
          </PressableScale>
        )}
      </View>
      {open && (
        <Animated.View entering={FadeIn.duration(160)} className="mt-3">
          <Text className="font-hk400 text-muted text-footnote">
            In Canvas, open Calendar and tap Calendar Feed, then copy the link. Google and Outlook
            calendars have one too, usually called the secret or public iCal address.
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={connect}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            placeholder="Paste the link here"
            placeholderTextColor={palette.muted}
            accessibilityLabel="Calendar feed link"
            className="bg-background border border-soft font-hk400 text-ink text-subhead mt-2.5"
            style={{ borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 }}
          />
          {feed.error && !feed.syncing && (
            <Text className="font-hk600 text-footnote mt-2" style={{ color: palette.dangerText }}>
              {FEED_ERRORS[feed.error]}
            </Text>
          )}
          <View className="flex-row mt-2.5" style={{ gap: 8 }}>
            <PressableScale
              onPress={() => setOpen(false)}
              className="items-center bg-surface border border-soft"
              style={{ borderRadius: 11, paddingVertical: 11, paddingHorizontal: 18 }}
            >
              <Text className="font-hk600 text-muted text-footnote">Cancel</Text>
            </PressableScale>
            <PressableScale
              onPress={connect}
              disabled={feed.syncing || !draft.trim()}
              className="flex-1 items-center bg-accent"
              style={{ borderRadius: 11, paddingVertical: 11 }}
            >
              <Text className="font-hk700 text-on-accent text-footnote">
                {feed.syncing ? 'Connecting…' : 'Connect'}
              </Text>
            </PressableScale>
          </View>
          <Text className="font-hk400 text-muted text-caption mt-2.5">
            Only what&apos;s due in the next 30 days comes in, and it waits in Later. The link stays
            on this phone and is only ever sent to the calendar it points at.
          </Text>
        </Animated.View>
      )}
    </Card>
  )
}

export default function YouScreen() {
  const palette = useColors()
  const router = useRouter()
  const { settings, updateSettings, showedUp, companionLevel, focus, exportData, resetAll } = useApp()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(settings.name)

  const version = Constants.expoConfig?.version ?? ''
  const reminderOn = settings.reminderHour != null
  const sound = settings.sound

  // The toggle says on, but notifications can be off in Settings. Better to say so
  // than leave someone waiting for a nudge that can't arrive.
  const [notificationsOff, setNotificationsOff] = useState(false)
  useEffect(() => {
    if (!reminderOn) {
      setNotificationsOff(false)
      return
    }
    const check = () => notificationsAllowed().then((ok) => setNotificationsOff(!ok))
    check()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check()
    })
    return () => sub.remove()
  }, [reminderOn])

  const saveName = () => {
    updateSettings({ name: nameDraft.trim() })
    setEditingName(false)
  }

  const toggleReminder = async () => {
    if (reminderOn) {
      updateSettings({ reminderHour: null })
      return
    }
    const allowed = await requestNotifications()
    if (allowed) {
      updateSettings({ reminderHour: REMINDER_HOURS[0].hour })
      return
    }
    Alert.alert(
      'Notifications are off',
      'Reminders need them. You can turn them on for Hyperfocus in Settings.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    )
  }

  const chooseSound = (next: SoundKind) => {
    updateSettings({ sound: next })
    // a running session is already playing it; otherwise let them hear it
    if (!focus?.running) previewSound(next)
  }

  const exportMyData = () => {
    Share.share({ message: exportData(), title: 'My Hyperfocus data' }).catch(() => {})
  }

  const confirmReset = () =>
    Alert.alert(
      'Reset everything?',
      'Every task, session and setting on this phone will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete all', style: 'destructive', onPress: resetAll },
      ]
    )

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Adjusting insets rather than avoiding the keyboard: the feed field sits low
          on this screen, and this also scrolls whichever input has focus into view. */}
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <Animated.View entering={FadeInUp.duration(260)}>
          <Text
            className="font-hk800 text-ink text-title1"
            style={{ letterSpacing: -0.8 }}
            maxFontSizeMultiplier={TITLE_SCALE}
            accessibilityRole="header"
          >
            You
          </Text>
        </Animated.View>

        {/* profile card */}
        <Animated.View
          entering={FadeInUp.delay(40).duration(260)}
          className="bg-surface border border-soft items-center"
          style={{ marginTop: 18, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 16 }}
        >
          <Sprite pose="idle" level={companionLevel} />
          {editingName ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onSubmitEditing={saveName}
              onBlur={saveName}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              placeholder="Your name"
              placeholderTextColor={palette.muted}
              accessibilityLabel="Your name"
              className="font-hk800 text-ink text-title2 text-center mt-1"
              style={{ minWidth: 160, paddingVertical: 2, borderBottomWidth: 1.5, borderBottomColor: palette.accent }}
            />
          ) : (
            <Pressable
              onPress={() => {
                setNameDraft(settings.name)
                setEditingName(true)
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityHint="Change your name"
            >
              <Text className="font-hk800 text-ink text-title2 mt-1" style={{ letterSpacing: -0.4 }}>
                {settings.name.trim() || 'Add your name'}
              </Text>
            </Pressable>
          )}
          <View className="flex-row flex-wrap justify-center mt-2.5" style={{ gap: 8 }}>
            <View className="bg-accent-soft rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text className="font-hk700 text-accent text-caption">Level {companionLevel}</Text>
            </View>
            {!settings.gentle && showedUp > 0 && (
              <View className="bg-accent-soft rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text className="font-hk700 text-accent text-caption">
                  {showedUp} {showedUp === 1 ? 'day' : 'days'} in 4 weeks
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(260)}>
          <SectionLabel>Focus</SectionLabel>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text className="font-hk700 text-ink text-subhead">Session length</Text>
            <View className="mt-2.5">
              <Segments
                groupLabel="Session length"
                value={settings.focusLen}
                onChange={(n) => updateSettings({ focusLen: n })}
                options={FOCUS_OPTIONS.map((n) => ({
                  value: n,
                  label: `${n}m`,
                  a11y: `${n} minutes`,
                }))}
              />
            </View>
            <Text className="font-hk400 text-muted text-footnote mt-2">
              You can always add or take off time during a session.
            </Text>

            <View style={{ height: 1, backgroundColor: palette.soft, marginVertical: 14 }} />

            <Text className="font-hk700 text-ink text-subhead">Focus sound</Text>
            <View className="mt-2.5">
              <Segments
                groupLabel="Focus sound"
                value={sound}
                onChange={chooseSound}
                options={SOUND_ORDER.map((k) => ({
                  value: k,
                  label: k === 'off' ? 'Off' : SOUNDS[k].short,
                  a11y: k === 'off' ? 'Off' : SOUNDS[k].label,
                }))}
              />
            </View>
            <Text className="font-hk400 text-muted text-footnote mt-2">
              {sound === 'off'
                ? 'Plays during sessions and mixes with your own music.'
                : `${SOUNDS[sound].blurb}. Plays during sessions and mixes with your own music.`}
            </Text>
          </Card>

          <SectionLabel>Reminders</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <ToggleRow
              title="A daily nudge"
              subtitle="One a day at most. Skips days you've already started, and goes quiet if you've been away a week."
              on={reminderOn}
              onToggle={toggleReminder}
              last={!reminderOn}
            />
            {reminderOn && (
              <Animated.View entering={FadeIn.duration(160)} style={{ padding: 14 }}>
                <Segments
                  groupLabel="Reminder time"
                  value={settings.reminderHour as number}
                  onChange={(hour) => updateSettings({ reminderHour: hour })}
                  options={REMINDER_HOURS.map((h) => ({ value: h.hour, label: h.label }))}
                />
                {notificationsOff && (
                  <Pressable
                    onPress={() => Linking.openSettings()}
                    hitSlop={8}
                    className="mt-2.5"
                    accessibilityRole="button"
                  >
                    <Text className="font-hk600 text-footnote" style={{ color: palette.dangerText }}>
                      Notifications are off for Hyperfocus, so these can&apos;t reach you. Tap to open
                      Settings.
                    </Text>
                  </Pressable>
                )}
              </Animated.View>
            )}
          </Card>

          <SectionLabel>Import</SectionLabel>
          <FeedCard />

          <SectionLabel>Preferences</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <ToggleRow
              title="Gentle mode"
              subtitle="No comparisons. Hides the race field, day counts and week-over-week."
              on={settings.gentle}
              onToggle={() => updateSettings({ gentle: !settings.gentle })}
            />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text className="font-hk700 text-ink text-body">Appearance</Text>
              <View className="mt-2.5">
                <Segments
                  groupLabel="Appearance"
                  value={settings.appearance}
                  onChange={(mode) => updateSettings({ appearance: mode })}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'Auto', a11y: 'Match my phone' },
                  ]}
                />
              </View>
            </View>
          </Card>

          <SectionLabel>About</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <LinkRow title="Replay welcome" onPress={() => router.push('/onboarding')} />
            <LinkRow
              title="Help and support"
              onPress={() => WebBrowser.openBrowserAsync(SUPPORT_URL).catch(() => {})}
            />
            <LinkRow
              title="Privacy policy"
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {})}
            />
            <LinkRow
              title="Export my data"
              hint="Shares your tasks and history as text"
              onPress={exportMyData}
            />
            <LinkRow title="Reset everything" danger last onPress={confirmReset} />
          </Card>

          <Text className="font-hk400 text-muted text-center text-caption" style={{ marginTop: 22 }}>
            Hyperfocus{version ? ` · v${version}` : ''}
            {'\n'}
            Everything stays on this phone. A productivity tool, not medical advice or treatment.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
