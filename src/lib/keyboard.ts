import { useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  KeyboardEvent,
  KeyboardMetrics,
  LayoutAnimation,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * How far the keyboard reaches up past the safe area at the bottom of the screen.
 *
 * Measured from the bottom because that's where a sheet is anchored. A sheet starts
 * partway down the screen, and KeyboardAvoidingView compares its own frame, measured
 * from the sheet's top, with the keyboard's place on the whole screen. Inside a sheet
 * it comes up short by however far down the sheet starts, which on an iPhone is about
 * the height of the suggestion bar. That's how the Brain dump's Sort button ended up
 * under the keyboard, where a tap on it picked a suggested word instead.
 */
export function keyboardOverlap(screenHeight: number, end: KeyboardMetrics, bottomInset: number) {
  // With Prefer Cross-Fade Transitions on, iOS reports a hiding keyboard as all zeros
  if (end.height === 0 || end.screenY === 0) return 0
  return Math.max(0, Math.round(screenHeight - end.screenY - bottomInset))
}

/**
 * Bottom padding that keeps a bottom-anchored screen above the keyboard, for screens
 * that SafeAreaView already pads at the bottom. iOS only: Android resizes the window.
 */
export function useKeyboardPadding() {
  const { height } = useWindowDimensions()
  const { bottom } = useSafeAreaInsets()
  const [padding, setPadding] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const settle = (next: number, duration?: number, easing?: KeyboardEvent['easing']) => {
      if (next === current.current) return
      current.current = next
      // ride along with the keyboard rather than jumping ahead of it
      if (duration) {
        const ms = Math.max(duration, 10)
        LayoutAnimation.configureNext({
          duration: ms,
          update: { duration: ms, type: (easing && LayoutAnimation.Types[easing]) || 'keyboard' },
        })
      }
      setPadding(next)
    }
    const subs = [
      Keyboard.addListener('keyboardWillChangeFrame', (e) =>
        settle(keyboardOverlap(height, e.endCoordinates, bottom), e.duration, e.easing)
      ),
      Keyboard.addListener('keyboardWillHide', (e) => settle(0, e.duration, e.easing)),
    ]
    // already up when the screen opens
    const metrics = Keyboard.metrics()
    if (Keyboard.isVisible() && metrics) settle(keyboardOverlap(height, metrics, bottom))
    return () => subs.forEach((s) => s.remove())
  }, [height, bottom])

  return padding
}
