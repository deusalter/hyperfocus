import Svg, { Path } from 'react-native-svg'
import { palette } from '@/lib/theme'

/**
 * The app's glyphs, as vectors.
 *
 * These used to be text characters (› ‹ ⌄ × ▾). Those come from whichever font
 * happens to have them, so they sit at different weights and baselines from one
 * screen to the next, and an unlucky one falls back to a system font entirely.
 */

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

function stroke(color: string, width: number) {
  return {
    stroke: color,
    strokeWidth: width,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }
}

export function ChevronRight({ size = 16, color = palette.muted, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m9 5 7 7-7 7" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function ChevronLeft({ size = 24, color = palette.muted, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m15 5-7 7 7 7" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function ChevronDown({ size = 16, color = palette.muted, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m5 9 7 7 7-7" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function CloseIcon({ size = 20, color = palette.muted, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6 6 18" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function PlusIcon({ size = 16, color = '#fff', strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function PlayIcon({ size = 14, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  )
}

export function PauseIcon({ size = 14, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5h3v14H8zM13 5h3v14h-3z" fill={color} />
    </Svg>
  )
}

export function SoundIcon({
  size = 16,
  color = palette.muted,
  strokeWidth = 2,
  off = false,
}: IconProps & { off?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" {...stroke(color, strokeWidth)} />
      {off ? (
        <Path d="m16 9.5 5 5M21 9.5l-5 5" {...stroke(color, strokeWidth)} />
      ) : (
        <Path d="M16 9a4.2 4.2 0 0 1 0 6M18.7 6.5a8 8 0 0 1 0 11" {...stroke(color, strokeWidth)} />
      )}
    </Svg>
  )
}

export function SyncIcon({ size = 13, color = palette.accent, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function ArrowRight({ size = 12, color = '#fff', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h14M13 6l6 6-6 6" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function ArrowLeft({ size = 12, color = '#fff', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H5M11 6l-6 6 6 6" {...stroke(color, strokeWidth)} />
    </Svg>
  )
}

export function TriangleUp({ size = 9, color = palette.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5 22 20H2z" fill={color} />
    </Svg>
  )
}
