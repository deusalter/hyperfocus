const plugin = require('tailwindcss/plugin')
const colors = require('./src/lib/colors.json')

/**
 * The palette's class names, one per token, each with a light value and a dark one.
 * Done here rather than with `dark:` on every element, so a screen can say text-ink
 * and mean it in either theme.
 */
const TOKENS = {
  background: 'background',
  ink: 'ink',
  surface: 'surface',
  muted: 'muted',
  soft: 'soft',
  accent: 'accent',
  'on-accent': 'onAccent',
  'accent-soft': 'accentSoft',
}
const DARK = '@media (prefers-color-scheme: dark)'

const themedColors = plugin(({ addUtilities }) => {
  const rules = {}
  for (const [name, token] of Object.entries(TOKENS)) {
    const light = colors.light[token]
    const dark = colors.dark[token]
    rules[`.bg-${name}`] = { backgroundColor: light, [DARK]: { backgroundColor: dark } }
    rules[`.text-${name}`] = { color: light, [DARK]: { color: dark } }
    rules[`.border-${name}`] = { borderColor: light, [DARK]: { borderColor: dark } }
  }
  addUtilities(rules)
})

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        // each RN weight is its own family — utilities per weight
        hk400: ['HankenGrotesk_400Regular'],
        hk500: ['HankenGrotesk_500Medium'],
        hk600: ['HankenGrotesk_600SemiBold'],
        hk700: ['HankenGrotesk_700Bold'],
        hk800: ['HankenGrotesk_800ExtraBold'],
        mono: ['SplineSansMono_500Medium'],
        mono600: ['SplineSansMono_600SemiBold'],
      },
    },
  },
  plugins: [themedColors],
}
