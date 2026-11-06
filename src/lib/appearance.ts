import { Appearance, Platform } from 'react-native'

export type AppearanceMode = 'light' | 'dark' | 'system'

/**
 * Light is the app's designed look and the default, so nobody's first impression
 * depends on their phone's setting. Dark and "match phone" are there to choose.
 *
 * This overrides the whole window, which also takes care of the keyboard and system
 * alerts. On web it does nothing: a browser's setting decides, and that's how the
 * contrast checks exercise both themes.
 */
export function applyAppearance(mode: AppearanceMode) {
  if (Platform.OS === 'web') return
  Appearance.setColorScheme(mode === 'system' ? null : mode)
}
