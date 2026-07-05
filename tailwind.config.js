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
        // "Rival" palette — calm paper-and-sky light theme
        background: '#eef0f0',
        ink: '#1d2023',
        surface: '#ffffff',
        muted: '#858c91',
        soft: '#e0e4e4',
        accent: '#4f7aa6',
        'accent-2': '#d98a4f',
        'accent-soft': '#dde8f1',
        // task energy categories
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
