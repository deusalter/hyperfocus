import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import Svg, { Path } from 'react-native-svg'
import RaceCard from '@/components/home/RaceCard'
import TaskRow from '@/components/home/TaskRow'
import Sprite from '@/components/Sprite'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { AWAY_DAYS, greeting } from '@/lib/points'
import { palette, hexA } from '@/lib/theme'

/** Growth, not a burning streak — nothing here can go out. */
function SproutIcon() {
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

export default function HomeScreen() {
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
    tasks,
    focus,
    focusTask,
    promoteToToday,
    startFocus,
  } = useApp()
  const [laterOpen, setLaterOpen] = useState(false)

  const overdueCount = tasks.filter(
    (t) => t.bucket !== 'inbox' && t.due && t.due < todayISO
  ).length

  const ptsDeltaLabel = !race.hasField
    ? 'First day — set the pace'
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <Animated.View entering={FadeInUp.duration(260)} className="flex-row justify-between items-start">
          <View>
            <Text className="font-hk500 text-muted text-[12px]">
              {format(new Date(), 'EEEE · MMMM d')}
            </Text>
            <Text className="font-hk800 text-ink text-[24px] mt-0.5" style={{ letterSpacing: -0.5 }}>
              {hello}
            </Text>
          </View>
          {/* Days active in the last month — not consecutive. A counter that
              zeroes on one miss punishes exactly the day you most need to
              come back, so this one only ever goes up within its window. */}
          {!settings.gentle && showedUp > 0 && (
            <View
              className="flex-row items-center bg-surface border border-soft rounded-full"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4 }}
              accessibilityLabel={`${showedUp} days showed up in the last month`}
            >
              <SproutIcon />
              <Text className="font-hk800 text-ink text-[13px]">{showedUp}</Text>
              <Text className="font-hk500 text-muted text-[11px]">days</Text>
            </View>
          )}
        </Animated.View>

        {/* A session survives being force-quit, so it needs somewhere to be
            seen — otherwise the clock runs where nobody can find it. */}
        {focus && (
          <Animated.View entering={FadeInUp.duration(220)}>
            <PressableScale
              haptic
              onPress={() => router.push('/focus')}
              className="bg-accent-soft flex-row items-center mt-3.5"
              style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 11 }}
            >
              <View
                className="bg-accent items-center justify-center"
                style={{ width: 30, height: 30, borderRadius: 15 }}
              >
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  {focus.running ? (
                    <Path d="M8 5v14l11-7z" fill="#fff" />
                  ) : (
                    <Path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="#fff" />
                  )}
                </Svg>
              </View>
              <View className="flex-1" style={{ minWidth: 0 }}>
                <Text className="font-hk800 text-ink text-[13.5px]">
                  {focus.running ? 'Session in progress' : 'Session paused'}
                </Text>
                <Text className="font-hk400 text-muted text-[11.5px] mt-0.5" numberOfLines={1}>
                  {focusTask?.title ?? 'One thing'}
                </Text>
              </View>
              <Text className="font-hk700 text-accent text-[12.5px]">Resume ›</Text>
            </PressableScale>
          </Animated.View>
        )}

        {/* race card */}
        <Animated.View entering={FadeInUp.delay(40).duration(260)} className="mt-3.5">
          <RaceCard />
        </Animated.View>

        {/* stat tiles */}
        <Animated.View entering={FadeInUp.delay(80).duration(260)} className="flex-row mt-3" style={{ gap: 10 }}>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text className="font-hk600 text-muted text-[11px]">MOMENTUM</Text>
            <View className="flex-row items-baseline mt-0.5" style={{ gap: 5 }}>
              <Text className="font-mono text-ink text-[26px]" style={{ letterSpacing: -0.5 }}>
                {todayTotals.points}
              </Text>
              <Text className="font-hk400 text-muted text-[12px]">pts</Text>
            </View>
            <Text
              className="font-hk700 text-[11.5px] mt-0.5"
              style={{ color: ahead ? palette.accent : palette.muted }}
            >
              {ptsDeltaLabel}
            </Text>
          </View>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text className="font-hk600 text-muted text-[11px]">DONE</Text>
            <View className="flex-row items-baseline mt-0.5" style={{ gap: 5 }}>
              <Text className="font-mono text-ink text-[26px]" style={{ letterSpacing: -0.5 }}>
                {todayTotals.completed}
              </Text>
              <Text className="font-hk400 text-muted text-[12px]">tasks</Text>
            </View>
            <Text className="font-hk700 text-muted text-[11.5px] mt-0.5">{doneDeltaLabel}</Text>
          </View>
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
                className="font-hk400 text-muted text-[12.5px] mt-1"
                style={{ lineHeight: 18 }}
              >
                It&apos;s been {away} days. Nothing piled up and nothing was lost — the
                race starts from wherever you are.
              </Text>
              {today.length > 0 && (
                <PressableScale
                  haptic
                  onPress={() => {
                    startFocus(today[0].id)
                    router.push('/focus')
                  }}
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
        ) : overdueCount > 0 && (
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
                  {overdueCount} slipped past — that&apos;s okay
                </Text>
                <Text className="font-hk400 text-muted text-[11.5px] mt-0.5">
                  Take a calm look in your weekly debrief
                </Text>
              </View>
              <Text className="text-muted text-[18px]">›</Text>
            </PressableScale>
          </Animated.View>
        )}

        {/* Today */}
        <Animated.View
          entering={FadeInUp.delay(130).duration(260)}
          className="mt-5 flex-row justify-between items-center"
        >
          <Text className="font-hk800 text-ink text-[16px]" style={{ letterSpacing: -0.3 }}>
            Today
          </Text>
          {inbox.length > 0 && (
            <Pressable
              onPress={() => router.push('/triage')}
              className="bg-accent-soft rounded-full"
              style={{ paddingHorizontal: 11, paddingVertical: 5 }}
            >
              <Text className="font-hk700 text-accent text-[11.5px]">Triage {inbox.length}</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Start one thing */}
        {today.length > 0 && (
          <Animated.View entering={FadeInUp.delay(155).duration(260)}>
            <PressableScale
              haptic
              onPress={() => {
                startFocus(today[0].id)
                router.push('/focus')
              }}
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
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path d="M8 5v14l11-7z" fill="#fff" />
                </Svg>
              </View>
              <View className="flex-1" style={{ minWidth: 0 }}>
                <Text className="font-hk800 text-white text-[14.5px]">Start one thing</Text>
                <Text className="font-hk400 text-white text-[11.5px] mt-0.5" style={{ opacity: 0.85 }} numberOfLines={1}>
                  {today[0].title}
                </Text>
                {/* The plan belongs at the point of performance. Knowing the
                    first physical move before you commit is what lowers the
                    activation cost — seeing it only after starting is too late
                    to help with the part that's actually hard. */}
                {today[0].firstStep && (
                  <Text
                    className="font-hk600 text-white text-[11px] mt-1"
                    style={{ opacity: 0.95 }}
                    numberOfLines={1}
                  >
                    → {today[0].firstStep}
                  </Text>
                )}
              </View>
              <Text
                className="font-hk700 text-white text-[10px]"
                style={{ opacity: 0.85, letterSpacing: 0.3 }}
              >
                {settings.focusLen}m
              </Text>
            </PressableScale>
          </Animated.View>
        )}

        {/* today list */}
        <View className="mt-2.5" style={{ gap: 8 }}>
          {today.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {today.length === 0 && (
            <View className="items-center" style={{ paddingVertical: 16, paddingHorizontal: 10 }}>
              {inbox.length === 0 && later.length === 0 && (
                <Sprite pose="wave" level={2} scale={0.75} />
              )}
              <Text className="font-hk400 text-muted text-[13px] text-center" style={{ lineHeight: 20 }}>
                Nothing here yet.{'\n'}Tap + to brain-dump, then sort.
              </Text>
            </View>
          )}
        </View>

        {/* Later */}
        {later.length > 0 && (
          <>
            <Pressable
              onPress={() => setLaterOpen((v) => !v)}
              className="mt-4 flex-row justify-between items-center"
            >
              <Text className="font-hk800 text-ink text-[16px]" style={{ letterSpacing: -0.3 }}>
                Later <Text className="font-hk600 text-muted">{later.length}</Text>
              </Text>
              <Text
                className="text-muted text-[18px]"
                style={{ transform: [{ rotate: laterOpen ? '180deg' : '0deg' }] }}
              >
                ⌄
              </Text>
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
                    <Text className="flex-1 font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                      {item.title}
                    </Text>
                    <Pressable
                      onPress={() => promoteToToday(item.id)}
                      className="bg-accent-soft rounded-full"
                      style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                    >
                      <Text className="font-hk700 text-accent text-[11px]">+ Today</Text>
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
