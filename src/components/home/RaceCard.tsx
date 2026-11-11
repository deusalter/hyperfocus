import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useIsFocused } from '@react-navigation/native'
import Confetti from '@/components/Confetti'
import RaceTrack from '@/components/home/RaceTrack'
import { useApp } from '@/store/AppStore'
import { TITLE_SCALE, useColors } from '@/lib/theme'
import { RETURN_MESSAGE, gentleMessage, raceMessage } from '@/lib/raceCopy'
import { sentence, spoken } from '@/lib/speech'

/**
 * "You & your recent days" — the live race against a field of past selves.
 *
 * The field matters. Racing one previous day ratchets: a good day sets a bar
 * you then have to clear, so success guarantees a later failure and the loss
 * lands hardest right after you did well. This races the last several active
 * days at once and marks the target at a *typical* day rather than a record
 * one. The headline is how many you've passed — graded, so there's no single
 * line whose far side is failure.
 *
 * Gentle mode drops the field entirely. For some people any comparison stings,
 * however kindly it's worded, so there the runner only ever shows today's progress.
 */
export default function RaceCard({ returning = false }: { returning?: boolean }) {
  const palette = useColors()
  const { todayTotals, race, level, settings, hydrated } = useApp()
  // Home stays mounted under the Focus screen and the recap, which is where points
  // are earned. The runner used to make its move right then, behind them, and be
  // standing still in its new place by the time anyone came back to look. The one
  // moment the race pays out has to be seen, so it waits for Home to be in front.
  const onScreen = useIsFocused()

  const gentle = settings.gentle
  const pts = todayTotals.points

  // level-up: a one-shot cheer, not an ambience
  const [burstKey, setBurstKey] = useState(0)
  const [cheering, setCheering] = useState(false)
  const prevLevel = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    const prev = prevLevel.current
    prevLevel.current = level
    if (prev != null && level > prev) {
      setBurstKey((k) => k + 1)
      setCheering(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      const t = setTimeout(() => setCheering(false), 1800)
      return () => clearTimeout(t)
    }
  }, [level, hydrated])

  // celebrate crossing the pacer once, not for the rest of the day
  const [paceKey, setPaceKey] = useState(0)
  const wasAhead = useRef<boolean | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (race.ahead && wasAhead.current === false && !gentle) setPaceKey((k) => k + 1)
    wasAhead.current = race.ahead
  }, [race.ahead, hydrated, gentle])

  // After a gap, and before anything's been done, the card names no number to
  // reach. "0 pts today" beside a typical day's total reads as a debt, on the one
  // screen that has promised there isn't one.
  const unhurried = returning && pts === 0
  const { title, detail, sub, said } = gentle
    ? gentleMessage(pts)
    : unhurried
      ? RETURN_MESSAGE
      : raceMessage(race, pts)
  // gentle mode's headline is already today's points
  const showPts = !gentle && !unhurried && (race.hasField || pts > 0)
  const { completed, minutes } = todayTotals
  const facts = [
    completed > 0 ? `${completed} ${completed === 1 ? 'task' : 'tasks'} done` : null,
    minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} focused` : null,
  ].filter(Boolean)
  const spokenLabel = [
    said ? sentence(said) : [title, detail].filter(Boolean).map((t) => sentence(t as string)).join(' '),
    showPts && !said ? `${pts} pts today.` : null,
    sub,
    facts.length ? sentence(facts.join(', ')) : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      className="bg-surface border border-soft"
      style={{ borderRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, overflow: 'hidden' }}
      // the track is a picture of these sentences, so read it as them
      accessible
      accessibilityLabel={spoken(spokenLabel)}
    >
      {burstKey + paceKey > 0 && <Confetti key={`c${burstKey}-${paceKey}`} />}

      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View className="flex-1" style={{ minWidth: 0 }}>
          <Text
            className="font-hk800 text-ink text-title3"
            style={{ letterSpacing: -0.4 }}
            maxFontSizeMultiplier={TITLE_SCALE}
          >
            {title}
          </Text>
          {detail && (
            <Text className="font-hk500 text-muted text-subhead" style={{ marginTop: 2 }} maxFontSizeMultiplier={TITLE_SCALE}>
              {detail}
            </Text>
          )}
        </View>
        {showPts && (
          <View className="items-end">
            <Text
              className="font-mono600 text-title3"
              style={{ color: race.ahead ? palette.accent : palette.ink, letterSpacing: -0.5 }}
              maxFontSizeMultiplier={TITLE_SCALE}
            >
              {pts}
            </Text>
            <Text className="font-hk600 text-muted text-caption" maxFontSizeMultiplier={1.4}>
              pts today
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: 2 }}>
        <RaceTrack
          points={pts}
          race={race}
          gentle={gentle}
          level={level}
          live={onScreen}
          ready={hydrated}
          cheering={cheering}
          rest={race.ahead && !gentle ? 'cheer' : 'idle'}
        />
      </View>

      <Text className="font-hk400 text-muted text-footnote" style={{ marginTop: 2 }}>
        {sub}
      </Text>
      {facts.length > 0 && (
        <View className="flex-row flex-wrap" style={{ columnGap: 16, rowGap: 4, marginTop: 12 }}>
          {facts.map((f) => (
            <Text key={f} className="font-hk700 text-ink text-footnote">
              {f}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}
