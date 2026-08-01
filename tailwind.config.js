/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // "Rival" palette — calm paper-and-sky light theme.
        // Tuned to clear WCAG AA (4.5:1) for body text while staying short of
        // maximal contrast: pure-black-on-pure-white is a documented source of
        // visual stress, so ink is near-black on warm off-white, not #000/#fff.
        background: '#eef0f0',
        ink: '#1d2023',
        surface: '#ffffff',
        muted: '#62686b', // was #858c91 — 2.98:1 on background, an AA failure
        soft: '#e0e4e4',
        accent: '#456a90', // was #4f7aa6 — white-on-accent landed at 4.4998:1
        'accent-2': '#d98a4f',
        'accent-soft': '#dde8f1',
        // task energy categories — vivid fills for icons and dots
        sprint: '#2f8f9c',
        fire: '#cc5b3e',
        grind: '#5a6f9c',
      },
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
  plugins: [],
}
