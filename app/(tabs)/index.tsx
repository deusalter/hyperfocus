import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import Svg, { Path } from 'react-native-svg'
import RaceCard from '@/components/home/RaceCard'
import TaskRow from '@/components/home/TaskRow'
import Sprite from '@/components/Sprite'
import DueTag from '@/components/DueTag'
import PressableScale from '@/components/ui/PressableScale'
import { ArrowRight, ChevronDown, ChevronRight, PauseIcon, PlayIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { useStartFocus } from '@/lib/useStartFocus'
import { AWAY_DAYS, greeting } from '@/lib/points'
import { hexA, useColors } from '@/lib/theme'

/** Growth, not a burning streak — nothing here can go out. */
function SproutIcon() {
  const palette = useColors()
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 21v-8M12 13C12 9 9 6 5 6c0 4 3 7 7 7ZM12 13c0-3.4 2.6-6 6-6 0 3.4-2.6 6-6 6Z"
        stroke={palette.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

function WarnIcon() {
  const palette = useColors()
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M10.3 4.3 2.6 18a1.5 1.5 0 0 0 1.3 2.3h16.2a1.5 1.5 0 0 0 1.3-2.3L13.7 4.3a1.5 1.5 0 0 0-2.6 0zM12 9v4M12 16.5h.01"
        stroke={palette.danger}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

function StatTile({
  label,
  value,
  unit,
  note,
  noteColor,
}: {
  label: string
  value: number
  unit: string
  note: string
  noteColor?: string
}) {
  const palette = useColors()
  return (
    <View
      className="flex-1 bg-surface border border-soft"
      style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}
      accessible
      accessibilityLabel={`${label.toLowerCase()}: ${value} ${unit}. ${note}.`}
    >
      <Text className="font-hk600 text-muted text-[11px]" maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <View className="flex-row items-baseline mt-0.5" style={{ gap: 5 }}>
        <Text
          className="font-mono text-ink text-[26px]"
          style={{ letterSpacing: -0.5 }}
          maxFontSizeMultiplier={1.3}
        >
          {value}
        </Text>
        <Text className="font-hk400 text-muted text-[12px]" maxFontSizeMultiplier={1.2}>
          {unit}
        </Text>
      </View>
      <Text
        className="font-hk700 text-[12px] mt-0.5"
        style={{ color: noteColor ?? palette.muted }}
        maxFontSizeMultiplier={1.2}
      >
        {note}
      </Text>
    </View>
  )
}

export default function HomeScreen() {
  const palette = useColors()
  const router = useRouter()
  const {
    settings,
    todayTotals,
    race,
    ahead,
    showedUp,
    away,
    todayKey: todayISO,
    inbox,
    today,
    later,
    upNext,
    overdue,
    focus,
    focusTask,
    updateTask,
  } = useApp()
  const start = useStartFocus()
  const [laterOpen, setLaterOpen] = useState(false)

  // "Not this one" walks down the ranked list. Rejecting a suggestion is much
  // cheaper than choosing from a list, so it stays one tap and needs no reason.
  const [skip, setSkip] = useState(0)
  useEffect(() => {
    if (skip >= upNext.length) setSkip(0)
  }, [skip, upNext.length])
  const next = upNext[skip] ?? upNext[0]

  const gentle = settings.gentle
  const ptsDeltaLabel = gentle
    ? 'Everything counts'
    : !race.hasField
      ? 'First day sets the pace'
      : ahead
        ? `+${todayTotals.points - race.pacer} past typical`
        : `Typical day · ${race.pacer}`
  // concrete and non-comparative — the points tile already carries the race
  const doneDeltaLabel =
    todayTotals.minutes > 0
      ? `${todayTotals.minutes}m focused today`
      : todayTotals.completed > 0
        ? 'Checked off directly'
        : 'Everything counts'

  const hello = `${greeting()}${settings.name.trim() ? `, ${settings.name.trim()}` : ''}`
  const nothingAtAll = today.length === 0 && inbox.length === 0 && later.length === 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <Animated.View entering={FadeInUp.duration(260)} className="flex-row justify-between items-start" style={{ gap: 10 }}>
          <View style={{ flexShrink: 1 }}>
            <Text className="font-hk500 text-muted text-[12px]">
              {format(new Date(), 'EEEE · MMMM d')}
            </Text>
            <Text
              className="font-hk800 text-ink text-[24px] mt-0.5"
              style={{ letterSpacing: -0.5 }}
              accessibilityRole="header"
              numberOfLines={2}
            >
              {hello}
            </Text>
          </View>
          {/* Days active in the last month — not consecutive. A counter that
              zeroes on one miss punishes exactly the day you most need to
              come back, so this one only ever goes up within its window. */}
          {!gentle && showedUp > 0 && (
            <View
              className="flex-row items-center bg-surface border border-soft rounded-full"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4 }}
              accessible
              accessibilityLabel={`Showed up ${showedUp} ${showedUp === 1 ? 'day' : 'days'} in the last 4 weeks`}
            >
              <SproutIcon />
              <Text className="font-hk800 text-ink text-[13px]" maxFontSizeMultiplier={1.2}>
                {showedUp}
              </Text>
              <Text className="font-hk500 text-muted text-[11px]" maxFontSizeMultiplier={1.2}>
                {showedUp === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* A session keeps running when you leave the screen, so it needs somewhere
            to be seen — otherwise the clock runs where nobody can find it. */}
        {focus && (
          <Animated.View entering={FadeInUp.duration(220)}>
            <PressableScale
              haptic
              onPress={() => router.push('/focus')}
              className="bg-accent-soft flex-row items-center mt-3.5"
              style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 11 }}
              accessibilityLabel={`${focus.running ? `Session in progress until ${format(focus.endsAt, 'h:mm a')}` : 'Session paused'} on ${focusTask?.title ?? focus.title ?? 'one thing'}. Resume.`}
            >
              <View
                className="bg-accent items-center justify-center"
                style={{ width: 30, height: 30, borderRadius: 15 }}
              >
                {focus.running ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
              </View>
              <View className="flex-1" style={{ minWidth: 0 }}>
                {/* A clock time rather than a countdown: it answers "how long have I
                    got" without re-rendering the whole screen every second. */}
                <Text className="font-hk800 text-ink text-[13.5px]" numberOfLines={1}>
                  {focus.running
                    ? `Session in progress · until ${format(focus.endsAt, 'h:mm a')}`
                    : 'Session paused'}
                </Text>
                <Text className="font-hk400 text-muted text-[12px] mt-0.5" numberOfLines={1}>
                  {focusTask?.title ?? focus.title ?? 'One thing'}
                </Text>
              </View>
              <Text className="font-hk700 text-accent text-[13px]">Resume</Text>
              <ChevronRight size={14} color={palette.accent} strokeWidth={2.8} />
            </PressableScale>
          </Animated.View>
        )}

        {/* race card */}
        <Animated.View entering={FadeInUp.delay(40).duration(260)} className="mt-3.5">
          <RaceCard />
        </Animated.View>

        {/* stat tiles */}
        <Animated.View entering={FadeInUp.delay(80).duration(260)} className="flex-row mt-3" style={{ gap: 10 }}>
          <StatTile
            label="MOMENTUM"
            value={todayTotals.points}
            unit="pts"
            note={ptsDeltaLabel}
            noteColor={ahead && !gentle ? palette.accent : palette.muted}
          />
          <StatTile
            label="DONE"
            value={todayTotals.completed}
            unit={todayTotals.completed === 1 ? 'task' : 'tasks'}
            note={doneDeltaLabel}
          />
        </Animated.View>

        {/* Coming back after a gap. This is the highest-stakes screen in the
            app: the dominant failure mode is abandonment after a lapse, so it
            shows zero accumulated debt and exactly one small next action. It
            deliberately replaces the overdue banner — being greeted by a
            backlog is the thing that makes people close the app again. */}
        {away != null && away >= AWAY_DAYS ? (
          <Animated.View entering={FadeInUp.delay(105).duration(260)}>
            <View
              className="bg-surface border border-soft mt-3"
              style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Text className="font-hk800 text-ink text-[14.5px]">Good to see you.</Text>
              <Text
                className="font-hk400 text-muted text-[13px] mt-1"
                style={{ lineHeight: 18 }}
              >
                It&apos;s been {away} days. Nothing piled up and nothing was lost. The race
                starts from wherever you are.
              </Text>
              {next && !focus && (
                <PressableScale
                  haptic
                  onPress={() => start(next.id)}
                  className="bg-accent-soft items-center mt-3"
                  style={{ borderRadius: 12, paddingVertical: 11 }}
                >
                  <Text className="font-hk700 text-accent text-[13px]">
                    Start with one small thing
                  </Text>
                </PressableScale>
              )}
            </View>
          </Animated.View>
        ) : overdue.length > 0 && (
          <Animated.View entering={FadeInUp.delay(105).duration(260)}>
            <PressableScale
              onPress={() => router.push('/debrief')}
              className="bg-surface border border-soft flex-row items-center mt-3"
              style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: hexA(palette.danger, 0.12),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarnIcon />
              </View>
              <View className="flex-1">
                <Text className="font-hk800 text-ink text-[13.5px]">
                  {overdue.length} slipped past. That&apos;s okay.
                </Text>
                <Text className="font-hk400 text-muted text-[12px] mt-0.5">
                  Take a calm look in your weekly debrief
                </Text>
              </View>
              <ChevronRight />
            </PressableScale>
          </Animated.View>
        )}

        {/* Today */}
        <Animated.View
          entering={FadeInUp.delay(130).duration(260)}
          className="mt-5 flex-row justify-between items-center"
        >
          <Text
            className="font-hk800 text-ink text-[16px]"
            style={{ letterSpacing: -0.3 }}
            accessibilityRole="header"
          >
            Today
          </Text>
          {inbox.length > 0 && (
            <Pressable
              onPress={() => router.push('/triage')}
              className="bg-accent-soft rounded-full"
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
              hitSlop={{ top: 9, bottom: 9, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Sort ${inbox.length} captured ${inbox.length === 1 ? 'thing' : 'things'}`}
            >
              <Text className="font-hk700 text-accent text-[12px]">Sort {inbox.length}</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Start one thing. Not while a session is running: the banner up top already
            says what you're doing, and offering another start contradicts it. */}
        {next && !focus && (
          <Animated.View entering={FadeInUp.delay(155).duration(260)}>
            <PressableScale
              haptic
              onPress={() => start(next.id)}
              className="bg-accent flex-row items-center mt-2.5"
              style={{
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 13,
                gap: 12,
                shadowColor: palette.accent,
                shadowOpacity: 0.32,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
              accessibilityLabel={`Start one thing: ${next.title}, ${settings.focusLen} minutes.${next.firstStep ? ` First move: ${next.firstStep}.` : ''}`}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: hexA(palette.onAccent, 0.18),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlayIcon />
              </View>
              <View className="flex-1" style={{ minWidth: 0 }}>
                <Text className="font-hk800 text-white text-[14.5px]">Start one thing</Text>
                <Text
                  className="font-hk400 text-white text-[12px] mt-0.5"
                  style={{ opacity: 0.85 }}
                  numberOfLines={1}
                >
                  {next.title}
                </Text>
                {/* The plan belongs at the point of performance. Knowing the
                    first physical move before you commit is what lowers the
                    activation cost — seeing it only after starting is too late
                    to help with the part that's actually hard. */}
                {next.firstStep && (
                  <View className="flex-row items-center mt-1" style={{ gap: 5 }}>
                    <ArrowRight size={11} />
                    <Text
                      className="font-hk600 text-white text-[12px]"
                      style={{ opacity: 0.95, flexShrink: 1 }}
                      numberOfLines={1}
                    >
                      {next.firstStep}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="font-hk700 text-white text-[11px]"
                style={{ opacity: 0.9, letterSpacing: 0.3 }}
              >
                {settings.focusLen}m
              </Text>
            </PressableScale>
            {upNext.length > 1 && (
              <Pressable
                onPress={() => setSkip((s) => (s + 1) % upNext.length)}
                hitSlop={{ top: 12, bottom: 8, left: 16, right: 8 }}
                className="self-end mt-2"
                accessibilityRole="button"
                accessibilityLabel="Not this one. Suggest another task."
              >
                <Text className="font-hk600 text-muted text-[12.5px]">Not this one</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* today list */}
        <View className="mt-2.5" style={{ gap: 8 }}>
          {today.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {today.length === 0 && (
            <View className="items-center" style={{ paddingVertical: 12, paddingHorizontal: 10 }}>
              {nothingAtAll && <Sprite pose="wave" level={2} scale={0.75} />}
              <Text
                className="font-hk400 text-muted text-[13.5px] text-center"
                style={{ lineHeight: 20, marginTop: nothingAtAll ? 4 : 0 }}
              >
                {nothingAtAll
                  ? "What's taking up space in your head?\nGet it out here, then sort it after."
                  : inbox.length > 0
                    ? 'Nothing on Today yet. Sort what you captured and pick a few.'
                    : 'Nothing on Today. Pull something up from Later when you feel like it.'}
              </Text>
              {/* a real button rather than instructions pointing at one */}
              {nothingAtAll && (
                <PressableScale
                  haptic
                  onPress={() => router.push('/dump')}
                  className="bg-accent mt-3.5"
                  style={{ borderRadius: 14, paddingVertical: 13, paddingHorizontal: 26 }}
                >
                  <Text className="font-hk700 text-white text-[14.5px]">Start a brain dump</Text>
                </PressableScale>
              )}
              {!nothingAtAll && inbox.length > 0 && (
                <PressableScale
                  haptic
                  onPress={() => router.push('/triage')}
                  className="bg-accent-soft mt-3"
                  style={{ borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20 }}
                >
                  <Text className="font-hk700 text-accent text-[13px]">
                    Sort {inbox.length} {inbox.length === 1 ? 'thing' : 'things'}
                  </Text>
                </PressableScale>
              )}
            </View>
          )}
        </View>

        {/* Later */}
        {later.length > 0 && (
          <>
            <Pressable
              onPress={() => setLaterOpen((v) => !v)}
              className="mt-4 flex-row justify-between items-center"
              style={{ paddingVertical: 4 }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: laterOpen }}
              accessibilityLabel={`Later, ${later.length} ${later.length === 1 ? 'task' : 'tasks'}`}
            >
              <Text className="font-hk800 text-ink text-[16px]" style={{ letterSpacing: -0.3 }}>
                Later <Text className="font-hk600 text-muted">{later.length}</Text>
              </Text>
              <View style={{ transform: [{ rotate: laterOpen ? '180deg' : '0deg' }] }}>
                <ChevronDown />
              </View>
            </Pressable>
            {laterOpen && (
              <View className="mt-2.5" style={{ gap: 8 }}>
                {later.map((item) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInUp.duration(220)}
                    className="bg-surface border border-soft flex-row items-center"
                    style={{ borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, gap: 11 }}
                  >
                    <Pressable
                      onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
                      className="flex-1"
                      style={{ minWidth: 0 }}
                      accessibilityRole="button"
                      accessibilityHint="Opens the task to edit it"
                    >
                      <Text className="font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                        {item.title}
                      </Text>
                      {(item.due || item.course) && (
                        <View className="flex-row flex-wrap items-center mt-1.5" style={{ gap: 6 }}>
                          {item.due && <DueTag due={item.due} today={todayISO} />}
                          {item.course && (
                            <Text className="font-hk600 text-muted text-[11px]" numberOfLines={1}>
                              {item.course}
                            </Text>
                          )}
                        </View>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => updateTask(item.id, { bucket: 'today' })}
                      className="bg-accent-soft rounded-full"
                      style={{ paddingHorizontal: 11, paddingVertical: 6 }}
                      hitSlop={{ top: 9, bottom: 9, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${item.title} to Today`}
                    >
                      <Text className="font-hk700 text-accent text-[12px]">+ Today</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
