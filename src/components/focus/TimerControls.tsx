import { View, Text } from 'react-native'
import { Play, Pause, RotateCcw, Square } from 'lucide-react-native'
import Button from '@/components/ui/Button'

interface Props {
  isRunning: boolean
  isPaused: boolean
  elapsed: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onStop: () => void
}

export default function TimerControls({
  isRunning,
  isPaused,
  elapsed,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
}: Props) {
  return (
    <View className="flex-row items-center justify-center gap-3 flex-wrap">
      {!isRunning && !isPaused && (
        <Button size="lg" onPress={onStart} className="min-w-[160px]">
          <Play size={18} color="#0a0d00" />
          <Text className="text-accent-ink font-medium text-base">Start focus</Text>
        </Button>
      )}

      {isRunning && (
        <>
          <Button size="lg" variant="secondary" onPress={onPause} className="min-w-[120px]">
            <Pause size={18} color="#f4f4f5" />
            <Text className="text-foreground font-medium text-base">Pause</Text>
          </Button>
          {elapsed > 0 && (
            <Button size="lg" variant="ghost" onPress={onStop} accessibilityLabel="End session and save">
              <Square size={14} color="#6b6b75" />
              <Text className="text-muted font-medium text-base">End</Text>
            </Button>
          )}
        </>
      )}

      {isPaused && (
        <>
          <Button size="lg" onPress={onResume} className="min-w-[120px]">
            <Play size={18} color="#0a0d00" />
            <Text className="text-accent-ink font-medium text-base">Resume</Text>
          </Button>
          <Button size="lg" variant="secondary" onPress={onReset} accessibilityLabel="Reset timer">
            <RotateCcw size={14} color="#f4f4f5" />
            <Text className="text-foreground font-medium text-base">Reset</Text>
          </Button>
          {elapsed > 0 && (
            <Button size="lg" variant="ghost" onPress={onStop} accessibilityLabel="End session and save">
              <Square size={14} color="#6b6b75" />
              <Text className="text-muted font-medium text-base">End</Text>
            </Button>
          )}
        </>
      )}
    </View>
  )
}
