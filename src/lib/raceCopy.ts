import { RaceField } from './points'

// What the race says about today, in words. Home's card, the recap and the widget
// all draw the same race, so the sentences live here and none of them can drift.

/**
 * Copy stays descriptive, never evaluative. The response to failure feedback
 * runs hotter than the response to success, so a shortfall is stated as a
 * distance to cover — never as a verdict on the day.
 */
/** `said` stands in for a title too terse to hear on its own. */
export interface Message {
  title: string
  detail?: string
  sub: string
  said?: string
}

export function raceMessage(race: RaceField, pts: number): Message {
  if (!race.hasField) {
    return {
      title: 'Nothing to race yet',
      detail: 'Today sets the pace.',
      sub: 'Finish anything, even something tiny, and the field starts filling in.',
    }
  }
  if (race.ahead) {
    return race.passed === race.ghosts.length
      ? {
          title: 'Past every recent day',
          detail: `${pts - race.pacer} pts beyond a typical one.`,
          sub: 'However the rest of today goes, this already counts.',
        }
      : {
          title: 'Past a typical day',
          detail: `${race.passed} of your last ${race.ghosts.length} days are behind you.`,
          sub: 'However the rest of today goes, this already counts.',
        }
  }
  if (pts === 0) {
    return {
      title: `A typical day is ${race.pacer} pts`,
      sub: 'No rush. One small session puts a runner on the board.',
    }
  }
  if (race.passed > 0) {
    return {
      title: `${race.passed} of ${race.ghosts.length} passed`,
      detail: `${race.pacer - pts} pts to a typical day`,
      said: `Passed ${race.passed} of your last ${race.ghosts.length} days. ${race.pacer - pts} pts to a typical day.`,
      sub: 'Every one you pass stays passed.',
    }
  }
  return {
    title: `${race.pacer - pts} pts to a typical day`,
    sub: 'Quiet days count too. Showing up is the part that compounds.',
  }
}

/** After a gap, before anything's been done: no number to reach. */
export const RETURN_MESSAGE: Message = {
  title: 'Nothing to catch up on',
  sub: 'One small session puts a runner on the board.',
}

export function gentleMessage(pts: number): Message {
  return pts > 0
    ? { title: `${pts} pts so far today`, sub: 'However the rest of today goes, this counts.' }
    : { title: 'A fresh day', sub: 'One small thing is plenty to start with.' }
}

/** The one line the widget has room for: the same headline Home's card leads with. */
export function raceHeadline(race: RaceField, pts: number, gentle: boolean): string {
  return (gentle ? gentleMessage(pts) : raceMessage(race, pts)).title
}
