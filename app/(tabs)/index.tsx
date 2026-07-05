import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import Svg, { Path } from 'react-native-svg'
import RaceCard from '@/components/home/RaceCard'
import TaskRow from '@/components/home/TaskRow'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { greeting, dayKey } from '@/lib/points'
import { palette, hexA } from '@/lib/theme'

function FlameIcon() {
  return (
    <Svg width={14} height={16} viewBox="0 0 14 16">
      <Path
        d="M7 0c1 3-1 4-2 6-1.5 3 .5 4 .5 4S4 9 6 7c0 2 3 3 3 6a4.5 4.5 0 1 1-9 0C0 8 6 7 7 0Z"
        fill={palette.accent}
      />
    </Svg>
  )
}

function WarnIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M10.3 4.3 2.6 18a1.5 1.5 0 0 0 1.3 2.3h16.2a1.5 1.5 0 0 0 1.3-2.3L13.7 4.3a1.5 1.5 0 0 0-2.6 0zM12 9v4M12 16.5h.01"
        stroke="#cc5b3e"
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
    baseline,
    ahead,
    streak,
    inbox,
    today,
    later,
    tasks,
    promoteToToday,
    startFocus,
  } = useApp()
  const [laterOpen, setLaterOpen] = useState(false)

  const todayISO = dayKey()
  const overdueCount = tasks.filter(
    (t) => t.bucket !== 'inbox' && t.due && t.due < todayISO
  ).length

  const pastPts = baseline?.totals.points
  const ptsDeltaLabel = ahead && pastPts != null
    ? `+${todayTotals.points - pastPts} past yesterday`
    : pastPts != null
      ? `Yesterday · ${pastPts}`
      : 'First day — set the pace'
  const doneDelta = baseline ? todayTotals.completed - baseline.totals.completed : 0
  const doneDeltaLabel = baseline
    ? doneDelta > 0
      ? `+${doneDelta} vs yesterday`
      : `Yesterday · ${baseline.totals.completed}`
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
        <Animated.View entering={FadeInUp.duration(320)} className="flex-row justify-between items-start">
          <View>
            <Text className="font-hk500 text-muted text-[12px]">
              {format(new Date(), 'EEEE · MMMM d')}
            </Text>
            <Text className="font-hk800 text-ink text-[24px] mt-0.5" style={{ letterSpacing: -0.5 }}>
              {hello}
            </Text>
          </View>
          {!settings.gentle && streak > 0 && (
            <View
              className="flex-row items-center bg-surface border border-soft rounded-full"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4 }}
            >
              <FlameIcon />
              <Text className="font-hk800 text-ink text-[13px]">{streak}</Text>
            </View>
          )}
        </Animated.View>

        {/* race card */}
        <Animated.View entering={FadeInUp.delay(60).duration(320)} className="mt-3.5">
          <RaceCard />
        </Animated.View>

        {/* stat tiles */}
        <Animated.View entering={FadeInUp.delay(120).duration(320)} className="flex-row mt-3" style={{ gap: 10 }}>
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

        {/* debrief banner */}
        {overdueCount > 0 && (
          <Animated.View entering={FadeInUp.delay(160).duration(320)}>
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
                  backgroundColor: hexA('#cc5b3e', 0.12),
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
          entering={FadeInUp.delay(200).duration(320)}
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
          <Animated.View entering={FadeInUp.delay(240).duration(320)}>
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
              </View>
              <Text className="font-hk700 text-white text-[10px]" style={{ opacity: 0.8, letterSpacing: 0.3 }}>
                NO PICKING
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
            <View className="items-center" style={{ paddingVertical: 22, paddingHorizontal: 10 }}>
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
