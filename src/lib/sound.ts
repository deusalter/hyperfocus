import { Platform } from 'react-native'
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { SoundKind } from './types'

export const SOUNDS: Record<
  Exclude<SoundKind, 'off'>,
  { label: string; short: string; blurb: string; asset: number }
> = {
  brown: {
    label: 'Brown noise',
    short: 'Brown',
    blurb: 'Deep and steady',
    asset: require('../../assets/sounds/brown.m4a'),
  },
  pink: {
    label: 'Pink noise',
    short: 'Pink',
    blurb: 'Soft, like steady rain',
    asset: require('../../assets/sounds/pink.m4a'),
  },
  waves: {
    label: 'Waves',
    short: 'Waves',
    blurb: 'Slow swells',
    asset: require('../../assets/sounds/waves.m4a'),
  },
}

export const SOUND_ORDER: SoundKind[] = ['off', 'brown', 'pink', 'waves']

const SUPPORTED = Platform.OS !== 'web'
const FULL_VOLUME = 0.8
const FADE_IN_MS = 1200
const FADE_OUT_MS = 500
const FADE_STEP_MS = 40
const PREVIEW_MS = 5000

let player: AudioPlayer | null = null
let loaded: SoundKind = 'off'
let fade: ReturnType<typeof setInterval> | null = null
let preview: ReturnType<typeof setTimeout> | null = null
let audioModeSet = false

/**
 * Keep playing with the screen locked or in another app, since most focus time
 * is spent somewhere else. Mix rather than interrupt: someone who works to music
 * can layer noise under it without their music stopping.
 */
function ensureAudioMode() {
  if (audioModeSet) return
  audioModeSet = true
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'mixWithOthers',
  }).catch((err) => console.warn('audio mode failed:', err))
}

function ramp(to: number, ms: number, then?: () => void) {
  if (fade) clearInterval(fade)
  fade = null
  const target = player
  if (!target) return
  const from = target.volume
  const steps = Math.max(1, Math.round(ms / FADE_STEP_MS))
  let step = 0
  fade = setInterval(() => {
    step += 1
    target.volume = from + (to - from) * (step / steps)
    if (step >= steps) {
      if (fade) clearInterval(fade)
      fade = null
      then?.()
    }
  }, FADE_STEP_MS)
}

function start(kind: Exclude<SoundKind, 'off'>) {
  ensureAudioMode()
  if (loaded !== kind) {
    player?.remove()
    player = createAudioPlayer(SOUNDS[kind].asset)
    player.loop = true
    player.volume = 0
    loaded = kind
  }
  player?.play()
  ramp(FULL_VOLUME, FADE_IN_MS)
}

function stop() {
  if (!player) return
  const target = player
  ramp(0, FADE_OUT_MS, () => target.pause())
}

function clearPreview() {
  if (preview) clearTimeout(preview)
  preview = null
}

/** Called whenever the session or the chosen sound changes. */
export function syncFocusSound(kind: SoundKind, sessionRunning: boolean) {
  if (!SUPPORTED) return
  if (sessionRunning) {
    clearPreview()
    if (kind === 'off') stop()
    else start(kind)
  } else if (!preview) {
    stop()
  }
}

/** A few seconds of the sound, so choosing one isn't blind. */
export function previewSound(kind: SoundKind) {
  if (!SUPPORTED) return
  clearPreview()
  if (kind === 'off') {
    stop()
    return
  }
  start(kind)
  preview = setTimeout(() => {
    preview = null
    stop()
  }, PREVIEW_MS)
}

export function silenceFocusSound() {
  if (!SUPPORTED) return
  clearPreview()
  stop()
}
