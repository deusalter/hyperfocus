import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useApp } from '@/store/AppStore'

/**
 * Every "start focusing" button goes through here.
 *
 * Sessions now keep running while you're elsewhere in the app, so a Focus button
 * can be tapped while one is going. Starting straight away would silently throw
 * the running session away, which is the one thing a timer can't be forgiven for.
 */
export function useStartFocus() {
  const { focus, focusTask, startFocus, switchFocus } = useApp()
  const router = useRouter()

  return useCallback(
    (taskId: string) => {
      if (!focus) {
        startFocus(taskId)
        router.push('/focus')
        return
      }
      if (focus.taskId === taskId) {
        router.push('/focus')
        return
      }
      const current = focusTask?.title ?? focus.title ?? 'your current task'
      Alert.alert('Already focusing', `You have a session going on "${current}".`, [
        { text: 'Back to it', style: 'cancel', onPress: () => router.push('/focus') },
        {
          text: 'Switch',
          onPress: () => {
            switchFocus(taskId)
            router.push('/focus')
          },
        },
      ])
    },
    [focus, focusTask, startFocus, switchFocus, router]
  )
}
