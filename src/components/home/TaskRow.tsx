import { View, Text, Pressable } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import CatTag from '@/components/CatTag'
import PressableScale from '@/components/ui/PressableScale'
import { Task } from '@/lib/types'
import { useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

/** One task on the Home Today list: check-off circle, title, Focus pill, cat cycling. */
export default function TaskRow({ task }: { task: Task }) {
  const { completeTask, cycleCat, startFocus } = useApp()
  const router = useRouter()

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.springify().damping(18)}
      className="bg-surface border border-soft"
      style={{ borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Pressable
          onPress={() => completeTask(task.id)}
          hitSlop={8}
          accessibilityLabel={`Complete ${task.title}`}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: palette.soft,
          }}
        />
        <Text className="flex-1 font-hk500 text-ink text-[14px]" style={{ lineHeight: 18 }}>
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
      <View className="flex-row items-center mt-2" style={{ gap: 8, paddingLeft: 34 }}>
        <Pressable onPress={() => cycleCat(task.id)} hitSlop={6}>
          <CatTag cat={task.cat ?? 'sprint'} />
        </Pressable>
        <Text className="font-hk400 text-muted text-[10px]">tap to recategorize</Text>
      </View>
    </Animated.View>
  )
}
