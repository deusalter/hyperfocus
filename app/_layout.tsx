import '../global.css'

import { useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk'
import {
  SplineSansMono_500Medium,
  SplineSansMono_600SemiBold,
} from '@expo-google-fonts/spline-sans-mono'
import { AppProvider, useApp } from '@/store/AppStore'
import { palette } from '@/lib/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

/** Friendly crash screen — shown by expo-router if anything below throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
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
      <Text style={{ fontSize: 40 }}>🫧</Text>
      <Text
        style={{
          color: palette.ink,
          fontSize: 20,
          fontWeight: '800',
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        Something hiccuped
      </Text>
      <Text
        style={{
          color: palette.muted,
          fontSize: 13,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 19,
        }}
      >
        Your tasks and points are safe on this device.{'\n'}
        {error.message}
      </Text>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 20,
          backgroundColor: palette.accent,
          borderRadius: 14,
          paddingVertical: 13,
          paddingHorizontal: 28,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Try again</Text>
      </Pressable>
    </View>
  )
}

function OnboardingGate() {
  const { hydrated, settings } = useApp()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    const onOnboarding = segments[0] === 'onboarding'
    if (!settings.onboarded && !onOnboarding) {
      router.replace('/onboarding')
    }
  }, [hydrated, settings.onboarded, segments, router])

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
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  useEffect(() => {
    if (fontError) console.warn('font load failed, falling back to system:', fontError)
  }, [fontError])

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
            <Stack.Screen name="focus" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="recap" options={{ gestureEnabled: false, animation: 'fade' }} />
          </Stack>
          {/* after the Stack so the hydration cover paints on top */}
          <OnboardingGate />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
