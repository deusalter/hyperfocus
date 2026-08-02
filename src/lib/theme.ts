// Single source of truth for the Rival design language.
// Mirrors tailwind.config.js — import these when a value is needed
// programmatically (SVG strokes, animated styles, dot fills).

/**
 * Tuned so body text clears WCAG AA (4.5:1) while staying short of maximal
 * contrast — pure black on pure white is a documented source of visual stress,
 * so this is near-black ink on warm off-white rather than #000 on #fff.
 */
export const palette = {
  background: '#eef0f0',
  ink: '#1d2023',
  surface: '#ffffff',
  muted: '#62686b', // was #858c91: 2.98:1 on background, an AA failure
  soft: '#e0e4e4',
  accent: '#456a90', // was #4f7aa6: white-on-accent landed at 4.4998:1
  accent2: '#d98a4f',
  accentSoft: '#dde8f1',
  /** overdue / destructive — the vivid tone, for icons and tints only */
  danger: '#cc5b3e',
  /** same intent as text: the vivid one is 4.09:1 on surface, under AA */
  dangerText: '#af4e35',
} as const

export type Cat = 'sprint' | 'fire' | 'grind'

export interface CatMeta {
  label: string
  /** vivid fill for icons and dots — non-text, so 3:1 is the bar */
  color: string
  /**
   * Darker sibling for the 11px chip label. The vivid fill sits at ~3.3:1 on
   * its own 13% tint, which is fine for a glyph and fails for a word.
   */
  textColor: string
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
    color: '#2f8f9c',
    textColor: '#277580',
    base: 18,
    rate: 1,
    blurb: 'Quick wins, low activation energy',
  },
  fire: {
    label: 'Fire',
    color: '#cc5b3e',
    textColor: '#af4e35',
    base: 30,
    rate: 2,
    blurb: 'Urgent or overdue — clears the most',
  },
  grind: {
    label: 'Grind',
    color: '#5a6f9c',
    textColor: '#566b96',
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

export const fonts = {
  hk400: 'HankenGrotesk_400Regular',
  hk500: 'HankenGrotesk_500Medium',
  hk600: 'HankenGrotesk_600SemiBold',
  hk700: 'HankenGrotesk_700Bold',
  hk800: 'HankenGrotesk_800ExtraBold',
  mono: 'SplineSansMono_500Medium',
  mono600: 'SplineSansMono_600SemiBold',
} as const
