// The widget extension: the Home Screen widget and the focus session's Live
// Activity. `npx expo prebuild` turns this folder into an Xcode target, so the
// Swift here is never copied into ios/. Colours mirror src/lib/colors.json.
const palette = require('../../src/lib/colors.json')

const both = (token) => ({ light: palette.light[token], dark: palette.dark[token] })

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  displayName: 'Hyperfocus',
  bundleIdentifier: '.widgets',
  // containerBackground, and widgets that tell the system which of their parts
  // are content, arrived in iOS 17. The app itself still runs on 15.1: on an older
  // phone the extension just isn't offered.
  deploymentTarget: '17.0',
  icon: '../../assets/icon.png',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
  colors: {
    $accent: both('accent'),
    $widgetBackground: both('surface'),
    surface: both('surface'),
    ink: both('ink'),
    muted: both('muted'),
    soft: both('soft'),
    accent: both('accent'),
    onAccent: both('onAccent'),
    accentSoft: both('accentSoft'),
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
})
