import { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import Sprite from '@/components/Sprite'
import { useApp } from '@/store/AppStore'
import { dayKey, addDays } from '@/lib/points'
import { palette, hexA } from '@/lib/theme'

const CHART_H = 132

export default function InsightsScreen() {
  const { bars, baseline, byDay, streak, companionLevel } = useApp()

  const pastPts = baseline?.totals.points ?? 0
  const maxPts = Math.max(...bars.map((b) => b.points), pastPts, 1)
  const baselinePct = pastPts > 0 ? Math.round((pastPts / maxPts) * 100) : 0

  const { weekTotal, lastWeekTotal, weekMinutes, bestDay } = useMemo(() => {
    const today = dayKey()
    let last = 0
    let minutes = 0
    for (let back = 13; back >= 7; back--) last += byDay.get(addDays(today, -back))?.points ?? 0
    for (let back = 6; back >= 0; back--) minutes += byDay.get(addDays(today, -back))?.minutes ?? 0
    const best = bars.reduce((acc, b) => (b.points > acc.points ? b : acc), bars[0])
    return {
      weekTotal: bars.reduce((a, b) => a + b.points, 0),
      lastWeekTotal: last,
      weekMinutes: minutes,
      bestDay: best,
    }
  }, [bars, byDay])

  const trendPct =
    lastWeekTotal > 0 ? Math.round(((weekTotal - lastWeekTotal) / lastWeekTotal) * 100) : null
  const trendUp = trendPct != null && trendPct >= 0
  const trendLabel =
    trendPct == null ? 'First week' : `${trendUp ? '▲' : '▼'} ${Math.abs(trendPct)}% vs last week`

  const growthMsg =
    streak > 1
      ? `Grown to level ${companionLevel} over ${streak} days of showing up. Small sessions, real growth.`
      : companionLevel > 0
        ? `Level ${companionLevel} and warming up. Every finished thing feeds it.`
        : 'Brand new. Finish one thing today and watch it take its first step.'

  const insightMsg =
    weekTotal === 0
      ? 'No data yet this week — your first focus session starts the picture.'
      : bestDay.points > 0
        ? `${bestDay.isToday ? 'Today' : bestDay.label} carried the week with ${bestDay.points} pts. Consistency beats intensity — keep the small days coming.`
        : 'Showing up at all is the hard part. The chart follows.'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(260)}>
          <Text className="font-hk800 text-ink text-[24px]" style={{ letterSpacing: -0.5 }}>
            Insights
          </Text>
          <Text className="font-hk400 text-muted text-[13px] mt-0.5">You vs your past self</Text>
        </Animated.View>

        {/* companion card */}
        <Animated.View
          entering={FadeInUp.delay(40).duration(260)}
          className="bg-surface border border-soft flex-row items-center mt-4"
          style={{ borderRadius: 20, padding: 16, gap: 8 }}
        >
          <Sprite pose="idle" level={companionLevel} scale={0.8} />
          <View className="flex-1">
            <Text className="font-hk700 text-muted text-[11px]" style={{ letterSpacing: 0.4 }}>
              YOUR COMPANION
            </Text>
            <Text className="font-hk800 text-ink text-[22px] mt-0.5" style={{ letterSpacing: -0.4 }}>
              Level {companionLevel}
            </Text>
            <Text className="font-hk400 text-ink text-[13px] mt-1" style={{ lineHeight: 19 }}>
              {growthMsg}
            </Text>
          </View>
        </Animated.View>

        {/* weekly chart */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(260)}
          className="bg-surface border border-soft mt-3"
          style={{ borderRadius: 20, padding: 16 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="font-hk800 text-ink text-[14px]">This week&apos;s momentum</Text>
            <View
              className="rounded-full"
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                backgroundColor: trendPct == null || trendUp ? palette.accentSoft : palette.soft,
              }}
            >
              <Text
                className="font-hk700 text-[11px]"
                style={{ color: trendPct == null || trendUp ? palette.accent : palette.muted }}
              >
                {trendLabel}
              </Text>
            </View>
          </View>

          <View style={{ height: CHART_H, marginTop: 18 }}>
            {baselinePct > 0 && (
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${baselinePct}%`,
                    borderTopWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: palette.muted,
                    opacity: 0.5,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: `${baselinePct}%`,
                    backgroundColor: palette.surface,
                    paddingHorizontal: 3,
                    transform: [{ translateY: -6 }],
                  }}
                >
                  <Text className="font-hk700 text-muted" style={{ fontSize: 9 }}>
                    avg {pastPts}
                  </Text>
                </View>
              </>
            )}
            <View className="flex-row items-end" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, gap: 7 }}>
              {bars.map((bar, i) => {
                const hPct = Math.max(3, Math.round((bar.points / maxPts) * 100))
                const fill = bar.isToday
                  ? palette.accent
                  : pastPts > 0 && bar.points >= pastPts
                    ? hexA(palette.accent, 0.55)
                    : palette.soft
                const lblColor = bar.isToday ? palette.accent : palette.muted
                return (
                  <View key={bar.key} className="flex-1 items-center justify-end h-full" style={{ gap: 6 }}>
                    <Text className="font-hk700" style={{ fontSize: 9, color: lblColor }}>
                      {bar.points}
                    </Text>
                    <Animated.View
                      entering={FadeInUp.delay(120 + i * 32).duration(300)}
                      style={{
                        width: '100%',
                        height: `${hPct}%`,
                        minHeight: 4,
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                        backgroundColor: fill,
                      }}
                    />
                    <Text className="font-hk600" style={{ fontSize: 9.5, color: lblColor }}>
                      {bar.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </Animated.View>

        {/* stat tiles */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)} className="flex-row mt-3" style={{ gap: 10 }}>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13 }}>
            <Text className="font-hk600 text-muted text-[11px]">SHOWING UP</Text>
            <View className="flex-row items-baseline mt-0.5" style={{ gap: 4 }}>
              <Text className="font-mono text-ink text-[24px]">{streak}</Text>
              <Text className="font-hk400 text-muted text-[12px]">days</Text>
            </View>
          </View>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13 }}>
            <Text className="font-hk600 text-muted text-[11px]">BEST DAY</Text>
            <View className="flex-row items-baseline mt-0.5" style={{ gap: 4 }}>
              <Text className="font-mono text-ink text-[24px]">{bestDay?.points ?? 0}</Text>
              <Text className="font-hk400 text-muted text-[12px]">pts</Text>
            </View>
          </View>
          <View className="flex-1 bg-surface border border-soft" style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13 }}>
            <Text className="font-hk600 text-muted text-[11px]">FOCUS</Text>
            <View className="flex-row items-baseline mt-0.5" style={{ gap: 4 }}>
              <Text className="font-mono text-ink text-[24px]">{(weekMinutes / 60).toFixed(1)}</Text>
              <Text className="font-hk400 text-muted text-[12px]">h wk</Text>
            </View>
          </View>
        </Animated.View>

        {/* insight note */}
        <Animated.View
          entering={FadeInUp.delay(160).duration(260)}
          className="bg-accent-soft flex-row items-start mt-3"
          style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, gap: 12 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginTop: 1 }}>
            <Circle cx={12} cy={12} r={9} stroke={palette.accent} strokeWidth={2} fill="none" />
            <Path d="M12 8v5M12 16h.01" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
          <Text className="flex-1 font-hk400 text-ink text-[13px]" style={{ lineHeight: 20 }}>
            {insightMsg}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
