import { useColorScheme } from 'react-native'
import colors from './colors.json'

// Every colour lives in colors.json, which tailwind.config.js reads too, so the
// class names and these values can't drift apart. Import from here when a value is
// needed programmatically (SVG strokes, animated styles, dot fills).

/**
 * Tuned so body text clears WCAG AA (4.5:1) in both themes while staying short of
 * maximal contrast. Pure black on pure white is a documented source of visual
 * stress, so light is near-black ink on warm off-white, and dark is the reverse of
 * that rather than white on black. `npm run e2e` measures this on every screen.
 *
 * A note on a few of the less obvious ones:
 * - `accent` has to work as text on a card and as a button fill. In dark no colour
 *   can carry both white text and read on a dark card, so filled controls take
 *   `onAccent` for what sits on them.
 * - `danger` is the vivid tone, for icons and tints. `dangerText` is the same intent
 *   adjusted to clear AA as words.
 * - Each category's `color` is for icons and dots, where 3:1 is the bar. `textColor`
 *   is its sibling for the 11px chip label, which the vivid fill fails on its own
 *   13% tint.
 */
export type Palette = typeof colors.light

export const lightPalette: Palette = colors.light
export const darkPalette: Palette = colors.dark

/** The colours for the current appearance. Re-renders when it changes. */
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette
}

export type Cat = 'sprint' | 'fire' | 'grind'

export interface CatMeta {
  label: string
  /**
   * Banked for finishing a thing of this kind at all — the reward for having
   * started. Deliberately large relative to `rate`: beginning is the expensive
   * part, and a score built only from minutes measures free time instead.
   */
  base: number
  /** points per focused minute — grind still rewards deep time */
  rate: number
  blurb: string
}

export const CATS: Record<Cat, CatMeta> = {
  sprint: {
    label: 'Sprint',
    base: 18,
    rate: 1,
    blurb: 'Quick wins, low activation energy',
  },
  fire: {
    label: 'Fire',
    base: 30,
    rate: 2,
    blurb: 'Urgent or overdue — clears the most',
  },
  grind: {
    label: 'Grind',
    base: 24,
    rate: 3,
    blurb: 'Deep, effortful, long-haul',
  },
} as const

export const CAT_ORDER: Cat[] = ['sprint', 'fire', 'grind']

export function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/**
 * A tint as a solid colour. Use for a tint that has text on it and isn't on a card:
 * a translucent one shows whatever is behind it, and the page ground is dark enough
 * to take a category's label under AA.
 */
export function tintOn(background: string, hex: string, alpha: number): string {
  const channel = (h: string, shift: number) => (parseInt(h.slice(1), 16) >> shift) & 255
  const mixed = [16, 8, 0].map((shift) =>
    Math.round(channel(hex, shift) * alpha + channel(background, shift) * (1 - alpha))
  )
  return `rgb(${mixed.join(',')})`
}

export const fonts = {
  hk400: 'HankenGrotesk_400Regular',
  hk500: 'HankenGrotesk_500Medium',
  hk600: 'HankenGrotesk_600SemiBold',
  hk700: 'HankenGrotesk_700Bold',
  hk800: 'HankenGrotesk_800ExtraBold',
  mono: 'SplineSansMono_500Medium',
  mono600: 'SplineSansMono_600SemiBold',
} as const
