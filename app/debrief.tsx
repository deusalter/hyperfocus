import { useMemo } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import CatTag from '@/components/CatTag'
import UndoToast from '@/components/UndoToast'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { STALE_DAYS, ageInDays } from '@/lib/points'
import { palette } from '@/lib/theme'
import { Task } from '@/lib/types'

function SectionHeading({ color, label, count }: { color: string; label: string; count?: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 7, marginTop: 20, marginBottom: 10, marginHorizontal: 2 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text
        className="font-hk800 text-ink text-[12px]"
        style={{ letterSpacing: 0.3 }}
        accessibilityRole="header"
      >
        {label}
      </Text>
      {count != null && <Text className="font-hk600 text-muted text-[12px]">{count}</Text>}
    </View>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View
      className="flex-1 bg-background"
      style={{ borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 }}
    >
      <Text
        className="font-hk600 text-muted text-[11px]"
        style={{ letterSpacing: 0.3 }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline" style={{ gap: 2 }}>
        <Text
          className="font-mono text-ink text-[19px]"
          style={{ letterSpacing: -0.4 }}
          maxFontSizeMultiplier={1.3}
        >
          {value}
        </Text>
        {sub && (
          <Text className="font-hk400 text-muted text-[11px]" maxFontSizeMultiplier={1.2}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  )
}

function dueLabel(due: string, todayISO: string): string {
  const diff = Math.round(
    (new Date(`${todayISO}T12:00:00`).getTime() - new Date(`${due}T12:00:00`).getTime()) / 86400000
  )
  return diff === 1 ? 'Due yesterday' : `Due ${diff} days ago`
}

export default function DebriefScreen() {
  const { tasks, week, showedUp, todayKey: todayISO, updateTask, letGo, settings } = useApp()
  const router = useRouter()
  const openTask = (id: string) => router.push({ pathname: '/task/[id]', params: { id } })

  const { overdue, todayItems, upcoming, fresh, stale } = useMemo(() => {
    const active = tasks.filter((t) => t.bucket !== 'inbox')
    const someday = active.filter((t) => t.bucket === 'later' && !t.due)
    // Things that quietly outlived their moment get pulled out and asked about
    // once, framed as a release. An undifferentiated graveyard you scroll past
    // every week is what makes people stop opening the screen.
    const isStale = (t: Task) => ageInDays(t.createdAt, todayISO) >= STALE_DAYS
    return {
      overdue: active.filter((t) => t.due && t.due < todayISO),
      todayItems: active.filter(
        (t) => t.due === todayISO || (t.bucket === 'today' && (!t.due || t.due === todayISO))
      ),
      upcoming: active
        .filter((t) => t.due && t.due > todayISO)
        .sort((a, b) => a.due!.localeCompare(b.due!)),
      fresh: someday.filter((t) => !isStale(t)),
      stale: someday.filter(isStale),
    }
  }, [tasks, todayISO])

  const doToday = (task: Task) => updateTask(task.id, { bucket: 'today', due: todayISO })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Weekly debrief"
          subtitle="Close out the week, then decide the next one. Nothing here is a grade."
        />

        {/* Opens with what the week contained, not what's outstanding. A
            temporal landmark motivates by putting the past in a finished
            accounting period — which only works if it leads with what you did. */}
        <Animated.View
          entering={FadeIn.duration(240)}
          className="bg-surface border border-soft mt-4"
          style={{ borderRadius: 20, padding: 16 }}
        >
          <Text className="font-hk700 text-muted text-[11px]" style={{ letterSpacing: 0.4 }}>
            YOUR LAST 7 DAYS
          </Text>
          <Text
            className="font-hk800 text-ink text-[17px] mt-1.5"
            style={{ letterSpacing: -0.3, lineHeight: 23 }}
          >
            {week.completed > 0
              ? `You finished ${week.completed} ${week.completed === 1 ? 'thing' : 'things'} across ${week.activeDays} ${week.activeDays === 1 ? 'day' : 'days'}.`
              : 'A quiet week. It still counts as a week.'}
          </Text>
          <View className="flex-row mt-3.5" style={{ gap: 10 }}>
            <Stat label="POINTS" value={`${week.points}`} />
            <Stat label="FOCUSED" value={`${Math.round(week.minutes / 6) / 10}h`} />
            {!settings.gentle && <Stat label="SHOWED UP" value={`${showedUp}`} sub="/28d" />}
          </View>
          {week.bestLabel && (
            <Text className="font-hk400 text-muted text-[12px] mt-3" style={{ lineHeight: 17 }}>
              {week.bestLabel} was your strongest at {week.bestPoints} pts. What&apos;s below is
              just the next set of choices.
            </Text>
          )}
        </Animated.View>

        {overdue.length > 0 && (
          <>
            <SectionHeading color={palette.danger} label="OVERDUE" count={overdue.length} />
            <View style={{ gap: 10 }}>
              {overdue.map((item) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(140)}
                  layout={LinearTransition.duration(180)}
                  className="bg-surface border border-soft"
                  style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13 }}
                >
                  <View className="flex-row items-start" style={{ gap: 11 }}>
                    <View style={{ marginTop: 1 }}>
                      <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                    </View>
                    <View className="flex-1" style={{ minWidth: 0 }}>
                      <Text className="font-hk600 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                        {item.title}
                      </Text>
                      <View className="flex-row flex-wrap items-center mt-1" style={{ gap: 8 }}>
                        <Text className="font-hk700 text-[12px]" style={{ color: palette.dangerText }}>
                          {dueLabel(item.due!, todayISO)}
                        </Text>
                        {item.course && (
                          <Text className="font-hk400 text-muted text-[11px]">· {item.course}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View className="flex-row mt-2.5" style={{ gap: 8 }}>
                    <PressableScale
                      haptic
                      onPress={() => doToday(item)}
                      className="flex-1 items-center bg-accent"
                      style={{ borderRadius: 11, paddingVertical: 10 }}
                    >
                      <Text className="font-hk700 text-white text-[13px]">Do today</Text>
                    </PressableScale>
                    <PressableScale
                      onPress={() => letGo(item.id)}
                      className="items-center"
                      accessibilityLabel={`Let go of ${item.title}`}
                      style={{
                        borderRadius: 11,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: palette.muted,
                      }}
                    >
                      <Text className="font-hk600 text-muted text-[13px]">Let go</Text>
                    </PressableScale>
                  </View>
                </Animated.View>
              ))}
            </View>
          </>
        )}

        {todayItems.length > 0 && (
          <>
            <SectionHeading color={palette.accent} label="TODAY" />
            <View style={{ gap: 8 }}>
              {todayItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => openTask(item.id)}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
                  accessibilityRole="button"
                  accessibilityHint="Opens the task to edit it"
                >
                  <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                  <Text className="flex-1 font-hk500 text-ink text-[14px]">{item.title}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <SectionHeading color={palette.muted} label="COMING UP" />
            <View style={{ gap: 8 }}>
              {upcoming.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => openTask(item.id)}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
                  accessibilityRole="button"
                  accessibilityHint="Opens the task to edit it"
                >
                  <Text
                    className="font-hk800 text-muted text-center text-[11px]"
                    style={{ width: 34 }}
                  >
                    {format(new Date(`${item.due}T12:00:00`), 'EEE')}
                  </Text>
                  <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                  <View className="flex-1" style={{ minWidth: 0 }}>
                    <Text className="font-hk500 text-ink text-[14px]" style={{ lineHeight: 17 }}>
                      {item.title}
                    </Text>
                    {item.course && (
                      <Text className="font-hk400 text-muted text-[11px] mt-0.5">{item.course}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {fresh.length > 0 && (
          <>
            <SectionHeading color={palette.soft} label="SOMEDAY" />
            <View style={{ gap: 8 }}>
              {fresh.map((item) => (
                <View
                  key={item.id}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, gap: 11 }}
                >
                  <Pressable
                    onPress={() => openTask(item.id)}
                    className="flex-1"
                    accessibilityRole="button"
                    accessibilityHint="Opens the task to edit it"
                  >
                    <Text className="font-hk500 text-ink text-[14px]">{item.title}</Text>
                  </Pressable>
                  <PressableScale
                    onPress={() => doToday(item)}
                    className="bg-accent-soft rounded-full"
                    style={{ paddingHorizontal: 11, paddingVertical: 6 }}
                    hitSlop={{ top: 9, bottom: 9, left: 6, right: 6 }}
                    accessibilityLabel={`Move ${item.title} to Today`}
                  >
                    <Text className="font-hk700 text-accent text-[12px]">+ Today</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </>
        )}

        {stale.length > 0 && (
          <>
            <SectionHeading color={palette.soft} label="STILL WAITING" count={stale.length} />
            <Text
              className="font-hk400 text-muted text-[12.5px]"
              style={{ marginHorizontal: 2, marginTop: -4, marginBottom: 10, lineHeight: 18 }}
            >
              These have been sitting {STALE_DAYS}+ days. Letting one go is a decision, and the
              list is meant to get shorter.
            </Text>
            <View style={{ gap: 8 }}>
              {stale.map((item) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(140)}
                  layout={LinearTransition.duration(180)}
                  className="bg-surface border border-soft"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12 }}
                >
                  <View className="flex-row items-baseline" style={{ gap: 8 }}>
                    <Text className="flex-1 font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
                      {item.title}
                    </Text>
                    <Text className="font-hk600 text-muted text-[11px]">
                      {Math.floor(ageInDays(item.createdAt, todayISO) / 7)}w
                    </Text>
                  </View>
                  <View className="flex-row mt-2.5" style={{ gap: 8 }}>
                    <PressableScale
                      onPress={() => letGo(item.id)}
                      className="flex-1 items-center"
                      accessibilityLabel={`Let go of ${item.title}`}
                      style={{
                        borderRadius: 11,
                        paddingVertical: 9,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: palette.muted,
                      }}
                    >
                      <Text className="font-hk700 text-muted text-[12.5px]">Let it go</Text>
                    </PressableScale>
                    <PressableScale
                      onPress={() => doToday(item)}
                      className="flex-1 items-center bg-accent-soft"
                      style={{ borderRadius: 11, paddingVertical: 9 }}
                    >
                      <Text className="font-hk700 text-accent text-[12.5px]">Still want it</Text>
                    </PressableScale>
                  </View>
                </Animated.View>
              ))}
            </View>
          </>
        )}

        <Text
          className="font-hk400 text-muted text-center text-[13px]"
          style={{ marginTop: 24, lineHeight: 19 }}
        >
          That&apos;s the week closed. You only have to do the next thing.
        </Text>
      </ScrollView>
      <UndoToast />
    </SafeAreaView>
  )
}
