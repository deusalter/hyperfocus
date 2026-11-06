import { Easing } from 'react-native-reanimated'

/**
 * The app's motion vocabulary.
 *
 * Two rules, both load-bearing for an ADHD audience:
 *
 * 1. **Nothing loops.** Motion onset captures attention involuntarily —
 *    top-down focus can't suppress it — so a looping animation re-grabs the
 *    user on every cycle. Ambient motion parallel to content that runs past
 *    5s is also a WCAG 2.2.2 Level A failure. Celebration is a burst that
 *    ends; only the sprite's slow breathe is allowed to idle, and only
 *    because it *is* the character rather than chrome around it. A cheer or
 *    wave finishes and holds its pose (see GESTURE_MS in Sprite).
 * 2. **Overshoot is an attention budget.** Visible bounce draws the eye to
 *    the motion itself, so it's spent only on earned moments (a level-up),
 *    never on routine reflow where it reads as toy-like.
 *
 * Durations follow the 200–500ms working band: under ~100ms reads as
 * instant, over 500ms reads as slow.
 */

export const EASE_OUT = Easing.out(Easing.cubic)
/** entering — decelerate into place */
export const EASE_IN_OUT = Easing.inOut(Easing.ease)

/** press feedback going in — deliberately below the 100ms "instant" floor */
export const TAP = { duration: 90, easing: EASE_OUT }
/** small element state changes (toggles, tags, checks) */
export const SNAP = { duration: 160, easing: EASE_OUT }
/** larger positional moves (tab lens, runner, cards settling) */
export const GLIDE = { duration: 260, easing: EASE_OUT }
/** screen-scale reveals and chart growth */
export const SWEEP = { duration: 380, easing: EASE_OUT }

/** entrance stagger step — small enough that a list never feels like a queue */
export const STAGGER = 32

/**
 * How long a celebration burst is allowed to run. Short enough to stay a
 * moment rather than an ambience, long enough to register.
 */
export const BURST_MS = 1600
