import { View, Text } from 'react-native'
import Svg, { Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg'
import { formatDuration } from '@/lib/utils'

interface Props {
  remaining: number
  progress: number
  isRunning: boolean
  isBreak: boolean
}

const SIZE = 280
const STROKE = 3

export default function TimerDisplay({ remaining, progress, isRunning, isBreak }: Props) {
  const radius = SIZE / 2 - 16
  const cx = SIZE / 2
  const cy = SIZE / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const ringColor = isBreak ? '#6ee7a7' : '#c5f82a'

  return (
    <View className="items-center justify-center py-8">
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Defs>
            <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={ringColor} stopOpacity="0.75" />
            </LinearGradient>
          </Defs>

          {/* Ticks — 60 marks, major every 5 */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180
            const isMajor = i % 5 === 0
            const innerR = radius - (isMajor ? 10 : 6)
            const outerR = radius - 2
            const r = (n: number) => n.toFixed(3)
            return (
              <Line
                key={i}
                x1={r(cx + innerR * Math.cos(angle))}
                y1={r(cy + innerR * Math.sin(angle))}
                x2={r(cx + outerR * Math.cos(angle))}
                y2={r(cy + outerR * Math.sin(angle))}
                stroke="#2a2a36"
                strokeWidth={isMajor ? 1 : 0.5}
                opacity={isMajor ? 0.5 : 0.2}
                strokeLinecap="round"
              />
            )
          })}

          {/* Background track */}
          <Circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1f1f28" strokeWidth={STROKE} />

          {/* Progress arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={STROKE + 1}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
          />
        </Svg>

        <View
          className="absolute inset-0 items-center justify-center"
          accessibilityRole="timer"
        >
          <Text
            className="text-foreground tabular-nums"
            style={{
              fontFamily: 'Georgia',
              fontStyle: 'italic',
              fontSize: 64,
              letterSpacing: -1,
            }}
          >
            {formatDuration(remaining)}
          </Text>
          <Text className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1">
            {isBreak ? 'Break' : isRunning ? 'Focusing' : 'Ready'}
          </Text>
        </View>
      </View>
    </View>
  )
}
