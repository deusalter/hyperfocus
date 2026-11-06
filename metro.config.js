const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Web only: resolve Reanimated from source, the same way iOS and Android do.
//
// Native Metro follows Reanimated's `react-native` field to `src/index`, so its
// JSX is compiled by NativeWind's runtime and `className` on Animated.View
// reaches the inner View. Web otherwise takes the precompiled `lib/module` build,
// which calls React's runtime directly and drops every className: button rows
// collapse and card backgrounds vanish, but only in a browser. Store screenshots
// and end-to-end checks come from the web build, so it has to match the phone.
const reanimatedSource = path.join(__dirname, 'node_modules/react-native-reanimated/src/index.ts')
const upstreamResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-reanimated') {
    return { type: 'sourceFile', filePath: reanimatedSource }
  }
  return upstreamResolve
    ? upstreamResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
