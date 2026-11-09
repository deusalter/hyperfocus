import { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import Sprite from '@/components/Sprite'
import { TriangleUp } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { addDays } from '@/lib/points'
import { spoken } from '@/lib/speech'
import { TITLE_SCALE, hexA, useColors, useLargeText } from '@/lib/theme'

const CHART_H = 132

/** One column of the week's stats card. */
function Stat({
  label,
  value,
  unit,
  a11y,
  first = false,
}: {
  label: string
  value: string
  unit: string
  a11y: string
  first?: boolean
}) {
  const palette = useColors()
  return (
    <View
      className="flex-1"
      style={{
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderLeftWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderLeftColor: palette.soft,
      }}
      accessible
      accessibilityLabel={a11y}
    >
      <Text className="font-hk600 text-muted text-caption" numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <View className="flex-row items-baseline flex-wrap" style={{ gap: 4, marginTop: 3 }}>
        <Text className="font-mono600 text-ink text-title2" style={{ letterSpacing: -0.5 }} maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
        <Text className="font-hk500 text-muted text-caption" maxFontSizeMultiplier={1.2}>
          {unit}
        </Text>
      </View>
    </View>
  )
}

export default function InsightsScreen() {
  const palette = useColors()
  const large = useLargeText()
  const { bars, race, byDay, showedUp, companionLevel, todayKey, settings } = useApp()
  const gentle = settings.gentle

  // gentle mode shows the week's shape with no line to measure it against
  const pacer = gentle ? 0 : race.pacer
  // a little headroom so the tallest bar never quite touches the ceiling
  const maxPts = Math.max(...bars.map((b) => b.points), pacer, 1) * 1.08
  const pacerPct = pacer > 0 ? Math.round((pacer / maxPts) * 100) : 0

  const { weekTotal, lastWeekTotal, weekMinutes, bestDay } = useMemo(() => {
    let last = 0
    let minutes = 0
    for (let back = 13; back >= 7; back--) last += byDay.get(addDays(todayKey, -back))?.points ?? 0
    for (let back = 6; back >= 0; back--) minutes += byDay.get(addDays(todayKey, -back))?.minutes ?? 0
    const best = bars.reduce((acc, b) => (b.points > acc.points ? b : acc), bars[0])
    return {
      weekTotal: bars.reduce((a, b) => a + b.points, 0),
      lastWeekTotal: last,
      weekMinutes: minutes,
      bestDay: best,
    }
  }, [bars, byDay, todayKey])

  const trendPct =
    lastWeekTotal > 0 ? Math.round(((weekTotal - lastWeekTotal) / lastWeekTotal) * 100) : null
  const trendUp = trendPct != null && trendPct >= 0
  // A down week is described, not scored: no red, no falling arrow, no percentage.
  const trendLabel =
    trendPct == null ? 'First week' : trendUp ? `${trendPct}% vs last week` : 'Quieter than last week'

  const growthMsg =
    showedUp > 1 && !gentle
      ? `Grown to level ${companionLevel} across ${showedUp} days of showing up this month. Small sessions, real growth.`
      : companionLevel > 0
        ? `Level ${companionLevel} and warming up. Every finished thing feeds it.`
        : 'Brand new. Finish one thing today and watch it take its first step.'

  const insightMsg =
    weekTotal === 0
      ? 'Nothing logged this week yet. Your first finished thing starts the picture.'
      : bestDay.points > 0 && !gentle
        ? `${bestDay.isToday ? 'Today' : bestDay.label} carried the week with ${bestDay.points} pts. Consistency beats intensity, so keep the small days coming.`
        : 'Every bar here is something you did. The chart only ever counts up.'

  const chartSummary = bars.map((b) => `${b.label} ${b.points}`).join(', ')

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(260)}>
          <Text
            className="font-hk800 text-ink text-title1"
            style={{ letterSpacing: -0.8 }}
            maxFontSizeMultiplier={TITLE_SCALE}
            accessibilityRole="header"
          >
            Insights
          </Text>
          <Text className="font-hk500 text-muted text-footnote" style={{ marginTop: 1 }}>
            {gentle ? 'What your week contained' : 'You vs your past self'}
          </Text>
        </Animated.View>

        {/* companion card */}
        <Animated.View
          entering={FadeInUp.delay(40).duration(260)}
          className="bg-surface border border-soft"
          style={{
            marginTop: 18,
            borderRadius: 24,
            paddingVertical: 16,
            paddingHorizontal: 18,
            gap: 10,
            // stacked at the accessibility sizes, so the words get the card's width
            flexDirection: large ? 'column' : 'row',
            alignItems: large ? 'flex-start' : 'center',
          }}
        >
          <Sprite pose="idle" level={companionLevel} scale={0.8} />
          <View className={large ? undefined : 'flex-1'} accessible>
            <Text className="font-hk600 text-muted text-caption" maxFontSizeMultiplier={1.2}>
              Your companion
            </Text>
            <Text
              className="font-hk800 text-ink text-title2"
              style={{ letterSpacing: -0.4, marginTop: 1 }}
              maxFontSizeMultiplier={TITLE_SCALE}
            >
              Level {companionLevel}
            </Text>
            <Text className="font-hk400 text-ink text-subhead" style={{ marginTop: 4 }}>
              {growthMsg}
            </Text>
          </View>
        </Animated.View>

        {/* weekly chart */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(260)}
          className="bg-surface border border-soft"
          style={{ marginTop: 14, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18 }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`This week's momentum in points. ${chartSummary}.${pacer > 0 ? ` A typical day is ${pacer}.` : ''}`}
        >
          <View className="flex-row justify-between items-center" style={{ gap: 8 }}>
            <Text className="font-hk800 text-ink text-headline" style={{ flexShrink: 1 }}>
              This week&apos;s momentum
            </Text>
            {!gentle && (
              <View
                className="flex-row items-center rounded-full"
                style={{
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: trendPct == null || trendUp ? palette.accentSoft : palette.soft,
                }}
              >
                {trendUp && <TriangleUp />}
                <Text
                  className="font-hk700 text-caption"
                  maxFontSizeMultiplier={1.2}
                  // ink on a down week: muted on this grey is 4.41:1, just under AA
                  style={{ color: trendPct == null || trendUp ? palette.accent : palette.ink }}
                >
                  {trendLabel}
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: CHART_H, marginTop: 18 }}>
            {/* Bars paint first so the pacer rule can sit on top of them —
                previously the line was drawn underneath and disappeared
                behind every bar that reached it. */}
            <View className="flex-row items-end" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, gap: 7 }}>
              {bars.map((bar, i) => {
                const hPct = Math.max(2, Math.round((bar.points / maxPts) * 100))
                const fill = bar.isToday
                  ? palette.accent
                  : pacer > 0 && bar.points >= pacer
                    ? hexA(palette.accent, 0.55)
                    : bar.points > 0
                      ? hexA(palette.accent, 0.28)
                      : palette.soft
                const lblColor = bar.isToday ? palette.accent : palette.muted
                return (
                  <View key={bar.key} className="flex-1 items-center h-full">
                    <Text
                      className="font-hk700"
                      maxFontSizeMultiplier={1}
                      numberOfLines={1}
                      style={{ fontSize: 10, lineHeight: 12, color: lblColor }}
                    >
                      {bar.points}
                    </Text>
                    {/* the bar sizes against this region, not the whole
                        column — otherwise the tallest bar plus its two labels
                        overflowed the chart and collided with the header */}
                    <View className="w-full" style={{ flex: 1, justifyContent: 'flex-end', paddingVertical: 4 }}>
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
                    </View>
                    <Text
                      className="font-hk600"
                      maxFontSizeMultiplier={1}
                      numberOfLines={1}
                      style={{ fontSize: 10, lineHeight: 13, color: lblColor }}
                    >
                      {bar.label}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* Inset to match the bars' own region (value label + padding on
                top, day label + padding below) so the rule lands at the same
                height the bars are measured against. */}
            {pacerPct > 0 && (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, top: 16, bottom: 17 }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${pacerPct}%`,
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
                    bottom: `${pacerPct}%`,
                    backgroundColor: palette.surface,
                    paddingHorizontal: 4,
                    borderRadius: 4,
                    transform: [{ translateY: -7 }],
                  }}
                >
                  {/* a typical day — not an average of everything */}
                  <Text
                    className="font-hk700 text-muted"
                    maxFontSizeMultiplier={1}
                    style={{ fontSize: 10 }}
                  >
                    typical {pacer}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* stat tiles */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(260)}
          className="bg-surface border border-soft flex-row"
          style={{ marginTop: 14, borderRadius: 24 }}
        >
          {gentle ? (
            <Stat
              first
              label="This week"
              value={`${weekTotal}`}
              unit="pts"
              a11y={`${weekTotal} points this week`}
            />
          ) : (
            <>
              <Stat
                first
                label="Showed up"
                value={`${showedUp}`}
                unit="of 28"
                a11y={`Showed up ${showedUp} of the last 28 days`}
              />
              <Stat
                label="Best day"
                value={`${bestDay?.points ?? 0}`}
                unit="pts"
                a11y={`Best day this week, ${bestDay?.points ?? 0} points`}
              />
            </>
          )}
          <Stat
            label="Focus this week"
            value={(weekMinutes / 60).toFixed(1)}
            unit="h"
            a11y={`${(weekMinutes / 60).toFixed(1)} hours focused this week`}
          />
        </Animated.View>

        {/* insight note */}
        <Animated.View
          entering={FadeInUp.delay(160).duration(260)}
          className="bg-accent-soft flex-row items-start"
          style={{ marginTop: 14, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, gap: 12 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginTop: 1 }}>
            <Circle cx={12} cy={12} r={9} stroke={palette.accent} strokeWidth={2} fill="none" />
            <Path d="M12 8v5M12 16h.01" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
          <Text
            className="flex-1 font-hk400 text-ink text-subhead"
            style={{ lineHeight: 21 }}
            accessibilityLabel={spoken(insightMsg)}
          >
            {insightMsg}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
