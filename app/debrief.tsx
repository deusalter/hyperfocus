import { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { format } from 'date-fns'
import CatTag from '@/components/CatTag'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PressableScale from '@/components/ui/PressableScale'
import { useApp } from '@/store/AppStore'
import { dayKey } from '@/lib/points'
import { palette } from '@/lib/theme'
import { Task } from '@/lib/types'

function SectionHeading({ color, label, count }: { color: string; label: string; count?: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 7, marginTop: 20, marginBottom: 10, marginHorizontal: 2 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="font-hk800 text-ink text-[12px]" style={{ letterSpacing: 0.3 }}>
        {label}
      </Text>
      {count != null && <Text className="font-hk600 text-muted text-[12px]">{count}</Text>}
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
  const { tasks, promoteToToday, setDue, removeTask } = useApp()
  const todayISO = dayKey()

  const { overdue, todayItems, upcoming, someday } = useMemo(() => {
    const active = tasks.filter((t) => t.bucket !== 'inbox')
    return {
      overdue: active.filter((t) => t.due && t.due < todayISO),
      todayItems: active.filter(
        (t) => t.due === todayISO || (t.bucket === 'today' && (!t.due || t.due === todayISO))
      ),
      upcoming: active
        .filter((t) => t.due && t.due > todayISO)
        .sort((a, b) => a.due!.localeCompare(b.due!)),
      someday: active.filter((t) => t.bucket === 'later' && !t.due),
    }
  }, [tasks, todayISO])

  const doToday = (task: Task) => {
    promoteToToday(task.id)
    setDue(task.id, todayISO)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Weekly debrief"
          subtitle="A calm look at what slipped, what's now, and what's coming. No guilt — just choices."
        />

        {overdue.length > 0 && (
          <>
            <SectionHeading color="#cc5b3e" label="OVERDUE" count={overdue.length} />
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
                      <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                        <Text className="font-hk700 text-[11.5px]" style={{ color: '#cc5b3e' }}>
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
                      onPress={() => removeTask(item.id)}
                      className="items-center"
                      style={{
                        borderRadius: 11,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: palette.soft,
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
                <View
                  key={item.id}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
                >
                  <CatTag cat={item.cat ?? 'sprint'} showLabel={false} />
                  <Text className="flex-1 font-hk500 text-ink text-[14px]">{item.title}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <SectionHeading color={palette.muted} label="COMING UP" />
            <View style={{ gap: 8 }}>
              {upcoming.map((item) => (
                <View
                  key={item.id}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 11 }}
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
                </View>
              ))}
            </View>
          </>
        )}

        {someday.length > 0 && (
          <>
            <SectionHeading color={palette.soft} label="SOMEDAY" />
            <View style={{ gap: 8 }}>
              {someday.map((item) => (
                <View
                  key={item.id}
                  className="bg-surface border border-soft flex-row items-center"
                  style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, gap: 11 }}
                >
                  <Text className="flex-1 font-hk500 text-ink text-[14px]">{item.title}</Text>
                  <PressableScale
                    onPress={() => doToday(item)}
                    className="bg-accent-soft rounded-full"
                    style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                  >
                    <Text className="font-hk700 text-accent text-[11px]">+ Today</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </>
        )}

        <Text
          className="font-hk400 text-muted text-center text-[12.5px]"
          style={{ marginTop: 24, lineHeight: 19 }}
        >
          That&apos;s the whole picture. You don&apos;t have to do it all — just the next thing.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
