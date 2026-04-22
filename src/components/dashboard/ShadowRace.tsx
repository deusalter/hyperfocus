import { useEffect, useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { format } from 'date-fns'
import { useStats } from '@/hooks/useStats'
import { buildDaySummaries, pickShadow, shadowSecondsAt, todayFocusSeconds } from '@/lib/shadow'
import { useTasks } from '@/hooks/useTasks'
import { useTimer } from '@/hooks/useTimer'
import { cn } from '@/lib/utils'

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}m`
}

function deltaLabel(sec: number): string {
  const abs = Math.abs(sec)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/**
 * The flagship mechanic. Races you against your past-self in real time.
 * Left track: lime dot (you today). Right track: ghost dot (past-self).
 * Shadow ticks on the wall-clock — if past-you started at 9:04am, shadow
 * starts counting today at 9:04am. The gap grows or closes live.
 */
export default function ShadowRace() {
  const { tasks } = useTasks()
  const { sessions } = useTimer()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { youSec, shadowSec, shadow, delta, maxSec } = useMemo(() => {
    const summaries = buildDaySummaries(sessions, tasks)
    const shadow = pickShadow(now, summaries)
    const youSec = todayFocusSeconds(summaries, now)
    const shadowSec = shadow ? shadowSecondsAt(shadow, now) : 0
    const delta = youSec - shadowSec
    const maxSec = Math.max(youSec, shadowSec, 60 * 30) // min floor so early lane isn't empty
    return { youSec, shadowSec, shadow, delta, maxSec }
  }, [now, sessions, tasks])

  if (!shadow) {
    return (
      <View className="py-6 border-y border-border">
        <Text className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          Shadow
        </Text>
        <Text className="text-muted-strong text-lg" style={{ fontFamily: 'Georgia' }}>
          Calibrating. This day sets the baseline.
        </Text>
        <Text className="text-xs text-muted mt-1">
          Next {format(now, 'EEEE')}, you&apos;ll race today&apos;s-you.
        </Text>
      </View>
    )
  }

  const ahead = delta >= 0
  const youPct = (youSec / maxSec) * 100
  const shadowPct = (shadowSec / maxSec) * 100

  return (
    <View className="py-5 border-y border-border">
      <View className="flex-row items-baseline justify-between mb-3">
        <Text className="text-[11px] font-mono uppercase tracking-widest text-muted">
          vs {format(new Date(shadow.dateISO + 'T00:00:00'), 'EEEE')}-self
        </Text>
        <Text
          className={cn(
            'text-[13px] font-mono tabular-nums',
            ahead ? 'text-accent' : 'text-danger'
          )}
        >
          {ahead ? '+' : '−'}{deltaLabel(delta)}
        </Text>
      </View>

      {/* You lane */}
      <View className="mb-2.5">
        <View className="flex-row items-baseline justify-between mb-1">
          <Text className="text-xs text-muted">you</Text>
          <Text className="text-xs font-mono tabular-nums text-foreground">{fmt(youSec)}</Text>
        </View>
        <View className="h-[6px] bg-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(youPct, 100)}%` }}
          />
        </View>
      </View>

      {/* Shadow lane */}
      <View>
        <View className="flex-row items-baseline justify-between mb-1">
          <Text className="text-xs text-muted">
            {format(new Date(shadow.dateISO + 'T00:00:00'), 'MMM d')}-self
          </Text>
          <Text className="text-xs font-mono tabular-nums text-muted-strong">{fmt(shadowSec)}</Text>
        </View>
        <View className="h-[6px] bg-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-muted"
            style={{ width: `${Math.min(shadowPct, 100)}%`, opacity: 0.6 }}
          />
        </View>
      </View>
    </View>
  )
}
