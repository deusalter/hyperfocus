import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SNAP } from '@/lib/motion'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import CatPicker from '@/components/CatPicker'
import DueTag from '@/components/DueTag'
import PressableScale from '@/components/ui/PressableScale'
import { Divider } from '@/components/ui/Group'
import { PlayIcon } from '@/components/ui/Icon'
import { Task } from '@/lib/types'
import { useApp } from '@/store/AppStore'
import { useStartFocus } from '@/lib/useStartFocus'
import { hexA, useColors, useLargeText } from '@/lib/theme'

const CHECK_DELAY_MS = 320

/** One row of the Home Today list: check-off circle, title, category, and a play button. */
export default function TaskRow({ task, first = false }: { task: Task; first?: boolean }) {
  const palette = useColors()
  // at the accessibility sizes Focus moves down beside the tags, so the title gets
  // the row's width instead of breaking words in a narrow column
  const large = useLargeText()
  const { completeTask, updateTask, todayKey, focus } = useApp()
  const router = useRouter()
  const start = useStartFocus()
  const [checking, setChecking] = useState(false)
  const inSession = focus?.taskId === task.id

  // check-off micro-moment: fill + pop, then the row leaves
  const fill = useSharedValue(0)
  // a control's outline needs 3:1 against the row; the soft grey it used was 1.2:1
  const ring = hexA(palette.muted, 0.75)
  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: fill.value > 0.5 ? palette.accent : 'transparent',
    borderColor: fill.value > 0.5 ? palette.accent : ring,
    transform: [{ scale: 1 + fill.value * 0.18 }],
  }))
  const checkStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scale: fill.value }],
  }))

  // the check animation outlives a fast unmount unless we hold the handle
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (pending.current) clearTimeout(pending.current) }, [])

  const onCheck = () => {
    if (checking) return
    setChecking(true)
    fill.value = withTiming(1, SNAP)
    pending.current = setTimeout(() => completeTask(task.id), CHECK_DELAY_MS)
  }

  // A round play button rather than a filled "Focus" pill on every row: three filled
  // buttons in a list competed with Start one thing, the one action Home is for.
  const focusButton = (
    <PressableScale
      haptic
      onPress={() => start(task.id)}
      className={inSession ? 'bg-accent' : 'bg-accent-soft'}
      style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}
      // 38pt as drawn, so a little slop carries it to 44
      hitSlop={4}
      accessibilityLabel={inSession ? `Back to ${task.title}` : `Focus on ${task.title}`}
    >
      <PlayIcon size={14} color={inSession ? palette.onAccent : palette.accent} />
    </PressableScale>
  )

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.duration(180)}
    >
      {!first && <Divider inset={54} />}
      <View className="flex-row items-center" style={{ gap: 14, paddingLeft: 16, paddingRight: 12, paddingVertical: 13 }}>
        <Pressable
          onPress={onCheck}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${task.title} done`}
        >
          <Animated.View
            style={[
              {
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
              },
              circleStyle,
            ]}
          >
            <Animated.View style={checkStyle}>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path
                  d="M5 12.5 10 17.5 19 7"
                  stroke={palette.onAccent}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </Pressable>
        <View className="flex-1" style={{ minWidth: 0 }}>
          {/* the title is the way in to everything else about the task */}
          <Pressable
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
            accessibilityRole="button"
            accessibilityHint="Opens the task to edit it"
          >
            <Text
              className="font-hk600 text-body"
              style={{ color: checking ? palette.muted : palette.ink }}
            >
              {task.title}
            </Text>
          </Pressable>
          <View className="flex-row flex-wrap items-center" style={{ gap: 8, marginTop: 7 }}>
            <CatPicker
              value={task.cat ?? 'sprint'}
              onChange={(cat) => updateTask(task.id, { cat })}
            />
            {task.due && <DueTag due={task.due} today={todayKey} />}
            {task.course && (
              <Text
                className="font-hk600 text-muted text-caption"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {task.course}
              </Text>
            )}
            {large && focusButton}
          </View>
        </View>
        {!large && focusButton}
      </View>
    </Animated.View>
  )
}

