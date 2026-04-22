import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTimer } from '@/hooks/useTimer'
import TimerDisplay from '@/components/focus/TimerDisplay'
import TimerControls from '@/components/focus/TimerControls'
import TimerPresets from '@/components/focus/TimerPresets'
import Button from '@/components/ui/Button'
import { Coffee, RotateCcw } from 'lucide-react-native'

export default function FocusScreen() {
  const {
    isRunning,
    isPaused,
    duration,
    remaining,
    elapsed,
    progress,
    isComplete,
    isBreak,
    start,
    pause,
    resume,
    reset,
    stop,
    startBreak,
    setDuration,
  } = useTimer()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pt-4 pb-8">
        <View className="mb-6">
          <Text
            className="text-foreground text-[40px] leading-tight"
            style={{ fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: -0.5 }}
          >
            Focus<Text className="text-accent">.</Text>
          </Text>
          <Text className="text-muted text-sm mt-1">One thing. Time-boxed. That&apos;s it.</Text>
        </View>

        {isComplete ? (
          <View className="items-start py-12">
            <Text
              className="text-foreground text-[44px] leading-tight"
              style={{ fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: -0.5 }}
            >
              {isBreak ? 'Break over.' : 'Session done.'}
            </Text>
            <Text className="text-muted text-sm mt-2 mb-6">
              {isBreak ? 'Ready for another round?' : 'Take a breath. Step away. Come back.'}
            </Text>
            <View className="flex-row gap-3 flex-wrap">
              {!isBreak && (
                <Button onPress={startBreak} variant="secondary">
                  <Coffee size={16} color="#f4f4f5" />
                  <Text className="text-foreground font-medium text-sm">5m break</Text>
                </Button>
              )}
              <Button onPress={() => start(duration)}>
                <RotateCcw size={16} color="#0a0d00" />
                <Text className="text-accent-ink font-medium text-sm">
                  {isBreak ? 'Start focus' : 'Another session'}
                </Text>
              </Button>
            </View>
          </View>
        ) : (
          <>
            <TimerPresets
              currentDuration={duration}
              onSelect={setDuration}
              disabled={isRunning || isPaused}
            />
            <TimerDisplay
              remaining={remaining}
              progress={progress}
              isRunning={isRunning}
              isBreak={isBreak}
            />
            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              elapsed={elapsed}
              onStart={() => start(duration)}
              onPause={pause}
              onResume={resume}
              onReset={reset}
              onStop={stop}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
