import '../global.css'

import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
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

  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    SplineSansMono_500Medium,
    SplineSansMono_600SemiBold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <OnboardingGate />
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
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
