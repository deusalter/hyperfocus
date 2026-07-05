// Single source of truth for the Rival design language.
// Mirrors tailwind.config.js — import these when a value is needed
// programmatically (SVG strokes, animated styles, dot fills).

export const palette = {
  background: '#eef0f0',
  ink: '#1d2023',
  surface: '#ffffff',
  muted: '#858c91',
  soft: '#e0e4e4',
  accent: '#4f7aa6',
  accent2: '#d98a4f',
  accentSoft: '#dde8f1',
} as const

export type Cat = 'sprint' | 'fire' | 'grind'

export interface CatMeta {
  label: string
  color: string
  /** points awarded for completing a task of this kind */
  base: number
  /** points per focused minute — grind rewards deep time */
  rate: number
  blurb: string
}

export const CATS: Record<Cat, CatMeta> = {
  sprint: {
    label: 'Sprint',
    color: '#2f8f9c',
    base: 8,
    rate: 1,
    blurb: 'Quick wins, low activation energy',
  },
  fire: {
    label: 'Fire',
    color: '#cc5b3e',
    base: 20,
    rate: 2,
    blurb: 'Urgent or overdue — clears the most',
  },
  grind: {
    label: 'Grind',
    color: '#5a6f9c',
    base: 14,
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
