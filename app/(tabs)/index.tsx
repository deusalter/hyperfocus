import { useEffect, useMemo, useState } from 'react'
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
import Group, { Divider } from '@/components/ui/Group'
import { ChevronDown, ChevronRight, PauseIcon, PlayIcon } from '@/components/ui/Icon'
import { useApp } from '@/store/AppStore'
import { useStartFocus } from '@/lib/useStartFocus'
import { QUICK_START_MIN } from '@/lib/session'
import { AWAY_DAYS, greeting } from '@/lib/points'
import { rankForReturn } from '@/lib/tasks'
import { TITLE_SCALE, hexA, useColors, useLargeText } from '@/lib/theme'

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

/**
 * A calendar page, not a warning triangle. The words beside it say "that's okay",
 * and a red alarm shape said the opposite louder. A missed date is a fact to look
 * at when there's room for it, which is what DueTag already says about its colour.
 */
function PastDateIcon() {
  const palette = useColors()
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M8 3v3M16 3v3M4 10h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke={palette.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export default function HomeScreen() {
  const palette = useColors()
  const large = useLargeText()
  const router = useRouter()
  const {
    settings,
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
  // After a few days away the offer is the cheapest thing to begin, not the most
  // urgent. The usual order leads with whatever is overdue, and being handed the
  // most dreaded task on the list is how a return turns back into an absence.
  const returning = away != null && away >= AWAY_DAYS
  const offered = useMemo(
    () => (returning ? rankForReturn(today, todayISO) : upNext),
    [returning, today, todayISO, upNext]
  )
  useEffect(() => {
    if (skip >= offered.length) setSkip(0)
  }, [skip, offered.length])
  const next = offered[skip] ?? offered[0]
  const startLabel = returning ? 'Start with one small thing' : 'Start one thing'

  const gentle = settings.gentle
  const hello = `${greeting()}${settings.name.trim() ? `, ${settings.name.trim()}` : ''}`
  const nothingAtAll = today.length === 0 && inbox.length === 0 && later.length === 0

  // Start one thing. Not while a session is running: the banner up top already
  // says what you're doing, and offering another start contradicts it.
  const startCard =
    next && !focus ? (
      <Animated.View entering={FadeInUp.delay(120).duration(260)}>
        <PressableScale
          haptic
          onPress={() => start(next.id)}
          className="bg-accent flex-row items-center"
          style={{
            marginTop: 12,
            borderRadius: 22,
            paddingLeft: 18,
            paddingRight: 16,
            paddingVertical: 16,
            gap: 14,
            shadowColor: palette.accent,
            shadowOpacity: 0.28,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
          accessibilityLabel={`${startLabel}: ${next.title}, ${settings.focusLen} minutes.${next.firstStep ? ` First move: ${next.firstStep}.` : ''}`}
        >
          <View className="flex-1" style={{ minWidth: 0 }}>
            {/* A button's words stop at twice their size. Uncapped, this card grew
                taller than the screen at the largest text setting, and its middle,
                where a thumb aims, sat under the tab bar. */}
            <Text
              className="font-hk700 text-on-accent text-footnote"
              style={{ opacity: 0.88 }}
              maxFontSizeMultiplier={TITLE_SCALE}
            >
              {startLabel}
            </Text>
            <Text
              className="font-hk800 text-on-accent text-headline"
              style={{ marginTop: 3 }}
              numberOfLines={large ? 4 : 2}
              maxFontSizeMultiplier={TITLE_SCALE}
            >
              {next.title}
            </Text>
            {/* The plan belongs at the point of performance. Knowing the
                first physical move before you commit is what lowers the
                activation cost — seeing it only after starting is too late
                to help with the part that's actually hard. */}
            {next.firstStep && (
              <Text
                className="font-hk500 text-on-accent text-footnote"
                style={{ opacity: 0.92, marginTop: 6 }}
                numberOfLines={large ? 4 : 2}
                maxFontSizeMultiplier={TITLE_SCALE}
              >
                First move: {next.firstStep}
              </Text>
            )}
          </View>
          <View className="items-center" style={{ gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: hexA(palette.onAccent, 0.16),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayIcon size={18} />
            </View>
            <Text
              className="font-hk700 text-on-accent text-caption"
              style={{ opacity: 0.9 }}
              maxFontSizeMultiplier={1.4}
            >
              {settings.focusLen} min
            </Text>
          </View>
        </PressableScale>
        {/* Two small ways to say "not like that". A shorter session, because agreeing
            to five minutes is a different size of decision from agreeing to
            twenty-five, and the recap offers to keep going once you're in. Or a
            different task, because rejecting a suggestion is cheaper than choosing
            from a list. */}
        <View
          className="flex-row flex-wrap justify-between items-center"
          style={{ marginTop: 10, columnGap: 16, rowGap: 10 }}
        >
          <Pressable
            onPress={() => start(next.id, QUICK_START_MIN)}
            hitSlop={{ top: 12, bottom: 8, left: 8, right: 16 }}
            accessibilityRole="button"
            accessibilityLabel={`Just ${QUICK_START_MIN} minutes on ${next.title}`}
          >
            <Text className="font-hk700 text-accent text-footnote">Just {QUICK_START_MIN} minutes</Text>
          </Pressable>
          {offered.length > 1 && (
            <Pressable
              onPress={() => setSkip((n) => (n + 1) % offered.length)}
              hitSlop={{ top: 12, bottom: 8, left: 16, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Not this one. Suggest another task."
            >
              <Text className="font-hk600 text-muted text-footnote">Not this one</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    ) : null

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        {/* at the accessibility sizes the pill sits under the greeting, not beside it */}
        <Animated.View
          entering={FadeInUp.duration(260)}
          className="justify-between items-start"
          style={{ gap: 10, flexDirection: large ? 'column' : 'row' }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text className="font-hk600 text-muted text-footnote" maxFontSizeMultiplier={TITLE_SCALE}>
              {format(new Date(), 'EEEE, MMMM d')}
            </Text>
            <Text
              className="font-hk800 text-ink text-title1"
              style={{ letterSpacing: -0.8, marginTop: 2 }}
              accessibilityRole="header"
              maxFontSizeMultiplier={TITLE_SCALE}
              numberOfLines={large ? 4 : 2}
            >
              {hello}
            </Text>
          </View>
          {/* Days active in the last month — not consecutive. A counter that
              zeroes on one miss punishes exactly the day you most need to
              come back, so this one only ever goes up within its window. */}
          {!gentle && showedUp > 0 && (
            <View
              className="flex-row items-center bg-surface rounded-full"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6 }}
              accessible
              accessibilityLabel={`Showed up ${showedUp} ${showedUp === 1 ? 'day' : 'days'} in the last 4 weeks`}
            >
              <SproutIcon />
              <Text className="font-hk800 text-ink text-footnote" maxFontSizeMultiplier={1.2}>
                {showedUp}
              </Text>
              <Text className="font-hk500 text-muted text-caption" maxFontSizeMultiplier={1.2}>
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
              className="bg-accent-soft flex-row items-center"
              style={{ marginTop: 16, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12, gap: 12 }}
              accessibilityLabel={`${focus.running ? `Session in progress until ${format(focus.endsAt, 'h:mm a')}` : 'Session paused'} on ${focusTask?.title ?? focus.title ?? 'one thing'}. Resume.`}
            >
              <View
                className="bg-accent items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: 18 }}
              >
                {focus.running ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
              </View>
              <View className="flex-1" style={{ minWidth: 0 }}>
                <Text className="font-hk700 text-ink text-subhead" numberOfLines={1}>
                  {focusTask?.title ?? focus.title ?? 'One thing'}
                </Text>
                {/* A clock time rather than a countdown: it answers "how long have I
                    got" without re-rendering the whole screen every second. */}
                <Text className="font-hk500 text-muted text-footnote" style={{ marginTop: 1 }} numberOfLines={1}>
                  {focus.running ? `Focusing until ${format(focus.endsAt, 'h:mm a')}` : 'Paused'}
                </Text>
              </View>
              <Text className="font-hk700 text-accent text-footnote">Resume</Text>
              <ChevronRight size={14} color={palette.accent} strokeWidth={2.8} />
            </PressableScale>
          </Animated.View>
        )}

        {/* Coming back after a gap. This is the highest-stakes screen in the
            app: the dominant failure mode is abandonment after a lapse, so it
            shows zero accumulated debt and exactly one small next action. The
            welcome comes first and the way in comes straight after it, ahead of
            the race: a card reading "0 pts today" against a typical day's total is
            a debt by another name, and it used to be the first thing shown. The
            overdue banner stays away altogether — being greeted by a backlog is
            the thing that makes people close the app again. */}
        {returning ? (
          <>
            <Animated.View entering={FadeInUp.delay(40).duration(260)}>
              <View
                className="bg-surface border border-soft"
                style={{ marginTop: 18, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 }}
              >
                <Text className="font-hk800 text-ink text-headline">Good to see you.</Text>
                <Text className="font-hk400 text-muted text-subhead" style={{ marginTop: 4 }}>
                  It&apos;s been {away} days. Nothing piled up and nothing was lost. The race
                  starts from wherever you are.
                </Text>
              </View>
            </Animated.View>
            {startCard}
            <Animated.View entering={FadeInUp.delay(120).duration(260)} style={{ marginTop: 18 }}>
              <RaceCard returning />
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInUp.delay(40).duration(260)} style={{ marginTop: 18 }}>
              <RaceCard />
            </Animated.View>
            {overdue.length > 0 && (
              <Animated.View entering={FadeInUp.delay(80).duration(260)}>
                <PressableScale
                  onPress={() => router.push('/debrief')}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ marginTop: 14, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 13, gap: 12 }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: palette.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PastDateIcon />
                  </View>
                  <View className="flex-1">
                    <Text className="font-hk700 text-ink text-subhead">
                      {overdue.length} slipped past. That&apos;s okay.
                    </Text>
                    <Text className="font-hk400 text-muted text-footnote" style={{ marginTop: 1 }}>
                      Take a calm look in your weekly debrief
                    </Text>
                  </View>
                  <ChevronRight />
                </PressableScale>
              </Animated.View>
            )}
          </>
        )}

        {/* Today */}
        <Animated.View
          entering={FadeInUp.delay(90).duration(260)}
          className="flex-row justify-between items-center"
          style={{ marginTop: 28 }}
        >
          <Text
            className="font-hk800 text-ink text-title3"
            style={{ letterSpacing: -0.4 }}
            accessibilityRole="header"
            maxFontSizeMultiplier={TITLE_SCALE}
          >
            Today
          </Text>
          {inbox.length > 0 && (
            <Pressable
              onPress={() => router.push('/triage')}
              className="bg-accent-soft rounded-full"
              style={{ paddingHorizontal: 13, paddingVertical: 7 }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Sort ${inbox.length} captured ${inbox.length === 1 ? 'thing' : 'things'}`}
            >
              <Text className="font-hk700 text-accent text-footnote">Sort {inbox.length}</Text>
            </Pressable>
          )}
        </Animated.View>

        {!returning && startCard}

        {/* today list */}
        {today.length > 0 ? (
          <Group style={{ marginTop: 14 }}>
            {today.map((task, i) => (
              <TaskRow key={task.id} task={task} first={i === 0} />
            ))}
          </Group>
        ) : (
          <View className="items-center" style={{ paddingVertical: 16, paddingHorizontal: 10 }}>
            {nothingAtAll && <Sprite pose="wave" level={2} scale={0.8} />}
            <Text
              className="font-hk400 text-muted text-subhead text-center"
              style={{ lineHeight: 22, marginTop: nothingAtAll ? 6 : 0 }}
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
                className="bg-accent"
                style={{ marginTop: 16, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28 }}
              >
                <Text className="font-hk700 text-on-accent text-subhead">Start a brain dump</Text>
              </PressableScale>
            )}
            {!nothingAtAll && inbox.length > 0 && (
              <PressableScale
                haptic
                onPress={() => router.push('/triage')}
                className="bg-accent-soft"
                style={{ marginTop: 14, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 22 }}
              >
                <Text className="font-hk700 text-accent text-subhead">
                  Sort {inbox.length} {inbox.length === 1 ? 'thing' : 'things'}
                </Text>
              </PressableScale>
            )}
          </View>
        )}

        {/* Later */}
        {later.length > 0 && (
          <>
            <Pressable
              onPress={() => setLaterOpen((v) => !v)}
              className="flex-row justify-between items-center"
              style={{ marginTop: 28, paddingVertical: 4 }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: laterOpen }}
              accessibilityLabel={`Later, ${later.length} ${later.length === 1 ? 'task' : 'tasks'}`}
            >
              <Text
                className="font-hk800 text-ink text-title3"
                style={{ letterSpacing: -0.4 }}
                maxFontSizeMultiplier={TITLE_SCALE}
              >
                Later <Text className="font-hk600 text-muted">{later.length}</Text>
              </Text>
              <View style={{ transform: [{ rotate: laterOpen ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} />
              </View>
            </Pressable>
            {laterOpen && (
              <Group style={{ marginTop: 12 }}>
                {later.map((item, i) => (
                  <Animated.View key={item.id} entering={FadeInUp.duration(220)}>
                    {i > 0 && <Divider />}
                    <View
                      className="flex-row items-center"
                      style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 13, gap: 12 }}
                    >
                      <Pressable
                        onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
                        className="flex-1"
                        style={{ minWidth: 0 }}
                        accessibilityRole="button"
                        accessibilityHint="Opens the task to edit it"
                      >
                        <Text className="font-hk600 text-ink text-body">{item.title}</Text>
                        {(item.due || item.course) && (
                          <View className="flex-row flex-wrap items-center" style={{ gap: 8, marginTop: 7 }}>
                            {item.due && <DueTag due={item.due} today={todayISO} />}
                            {item.course && (
                              <Text className="font-hk600 text-muted text-caption" numberOfLines={1}>
                                {item.course}
                              </Text>
                            )}
                          </View>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => updateTask(item.id, { bucket: 'today' })}
                        className="bg-accent-soft rounded-full"
                        style={{ paddingHorizontal: 13, paddingVertical: 8 }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${item.title} to Today`}
                      >
                        <Text className="font-hk700 text-accent text-footnote">+ Today</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </Group>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
