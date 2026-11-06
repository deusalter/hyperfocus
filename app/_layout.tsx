import '../global.css'

import { useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
// One import per weight. The package index requires every weight and italic it
// ships, which put 36 font files in the app to use seven.
import { HankenGrotesk_400Regular } from '@expo-google-fonts/hanken-grotesk/400Regular'
import { HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk/500Medium'
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold'
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk/700Bold'
import { HankenGrotesk_800ExtraBold } from '@expo-google-fonts/hanken-grotesk/800ExtraBold'
import { SplineSansMono_500Medium } from '@expo-google-fonts/spline-sans-mono/500Medium'
import { SplineSansMono_600SemiBold } from '@expo-google-fonts/spline-sans-mono/600SemiBold'
import { AppProvider, useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

const SPLASH_WATCHDOG_MS = 4000

/** Friendly crash screen — shown by expo-router if anything below throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // a crash before the first paint would otherwise sit behind the splash forever
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Text
        style={{
          color: palette.ink,
          fontSize: 20,
          fontWeight: '800',
          textAlign: 'center',
        }}
        accessibilityRole="header"
      >
        Something hiccuped
      </Text>
      <Text
        style={{
          color: palette.muted,
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        Your tasks and points are safe on this phone.
        {__DEV__ ? `\n\n${error.message}` : ''}
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={{
          marginTop: 20,
          backgroundColor: palette.accent,
          borderRadius: 14,
          paddingVertical: 13,
          paddingHorizontal: 28,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Try again</Text>
      </Pressable>
    </View>
  )
}

/** Decides what's on screen before the first real paint, and when to reveal it. */
function AppGate() {
  const { hydrated, settings, recapPending } = useApp()
  const segments = useSegments()
  const router = useRouter()
  const top = segments[0]

  useEffect(() => {
    if (!hydrated) return
    if (!settings.onboarded && top !== 'onboarding') router.replace('/onboarding')
  }, [hydrated, settings.onboarded, top, router])

  // The splash holds until saved data is in, so launch goes straight from the
  // mark to the right screen with its real numbers. One frame later than the
  // redirect above, so a first run never glimpses Home on the way to onboarding.
  useEffect(() => {
    if (!hydrated) return
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {})
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrated])

  // A session that ended somewhere other than the focus screen still gets its
  // recap, but only from the tabs. Landing it on top of a half-finished brain dump
  // would interrupt the one thing this app promises not to, so it waits until
  // that sheet closes.
  useEffect(() => {
    if (recapPending && top === '(tabs)') router.push('/recap')
  }, [recapPending, top, router])

  // cover the UI until storage has hydrated — prevents a one-frame flash of
  // the home screen before a first-run redirect to onboarding
  if (!hydrated) {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.background,
          zIndex: 100,
        }}
      />
    )
  }
  return null
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    SplineSansMono_500Medium,
    SplineSansMono_600SemiBold,
  })

  // A font fetch that fails used to hang on the splash screen forever. Ship
  // the app in system type instead — unstyled beats unreachable.
  const ready = fontsLoaded || !!fontError

  useEffect(() => {
    if (fontError) console.warn('font load failed, falling back to system:', fontError)
  }, [fontError])

  // The splash normally lifts once saved data is in. If something ever hangs before
  // that, a slow first paint beats a logo that never goes away.
  useEffect(() => {
    const watchdog = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), SPLASH_WATCHDOG_MS)
    return () => clearTimeout(watchdog)
  }, [])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="dump" options={{ presentation: 'modal' }} />
            <Stack.Screen name="triage" options={{ presentation: 'modal' }} />
            <Stack.Screen name="debrief" options={{ presentation: 'modal' }} />
            <Stack.Screen name="task/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="focus" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="recap" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
          </Stack>
          {/* after the Stack so the hydration cover paints on top */}
          <AppGate />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
