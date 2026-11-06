import { useCallback, useRef } from 'react'
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

  // The alert can sit open while the session ends underneath it, so its buttons
  // check again when tapped. By then the recap is showing and they've nothing to do.
  const running = useRef(focus)
  running.current = focus

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
        {
          text: 'Back to it',
          style: 'cancel',
          onPress: () => {
            if (running.current) router.push('/focus')
          },
        },
        {
          text: 'Switch',
          onPress: () => {
            if (!running.current) return
            switchFocus(taskId)
            router.push('/focus')
          },
        },
      ])
    },
    [focus, focusTask, startFocus, switchFocus, router]
  )
}
