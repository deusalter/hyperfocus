import { Easing } from 'react-native-reanimated'

// The app's motion vocabulary. UI chrome never bounces — ease-out timings
// only. Springs with visible overshoot are reserved for the companion
// sprite's character animation, nothing else.

export const EASE_OUT = Easing.out(Easing.cubic)

/** press feedback going in */
export const TAP = { duration: 90, easing: EASE_OUT }
/** small element state changes (toggles, tags, checks) */
export const SNAP = { duration: 160, easing: EASE_OUT }
/** larger positional moves (tab lens, runner, cards settling) */
export const GLIDE = { duration: 260, easing: EASE_OUT }
