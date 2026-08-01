import { memo, useEffect, useRef, useState } from 'react'
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
import PressableScale from '@/components/ui/PressableScale'
import { Task } from '@/lib/types'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

const CHECK_DELAY_MS = 320

/** One task on the Home Today list: check-off circle, title, Focus pill, cat cycling. */
function TaskRow({ task }: { task: Task }) {
  const { completeTask, setCat, startFocus } = useApp()
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  // check-off micro-moment: fill + pop, then the row leaves
  const fill = useSharedValue(0)
  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: fill.value > 0.5 ? palette.accent : 'transparent',
    borderColor: fill.value > 0.5 ? palette.accent : palette.soft,
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

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.duration(180)}
      className="bg-surface border border-soft"
      style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Pressable onPress={onCheck} hitSlop={12} accessibilityLabel={`Complete ${task.title}`}>
          <Animated.View
            style={[
              {
                width: 22,
                height: 22,
                borderRadius: 11,
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
                  stroke="#fff"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </Pressable>
        <Text
          className="flex-1 font-hk500 text-[14px]"
          style={{ lineHeight: 18, color: checking ? palette.muted : palette.ink }}
        >
          {task.title}
        </Text>
        <PressableScale
          haptic
          onPress={() => {
            startFocus(task.id)
            router.push('/focus')
          }}
          className="bg-accent rounded-full"
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text className="font-hk700 text-white text-[11.5px]">Focus</Text>
        </PressableScale>
      </View>
      <View className="flex-row items-center mt-2" style={{ paddingLeft: 34 }}>
        <CatPicker value={task.cat ?? 'sprint'} onChange={(cat) => setCat(task.id, cat)} />
      </View>
    </Animated.View>
  )
}

export default memo(TaskRow)
