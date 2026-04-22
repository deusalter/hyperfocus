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
        background: '#07070a',
        foreground: '#f4f4f5',
        muted: '#6b6b75',
        'muted-strong': '#8a8a95',
        surface: '#0e0e13',
        'surface-hover': '#14141b',
        border: '#1f1f28',
        'border-hover': '#2a2a36',
        accent: '#c5f82a',
        'accent-light': '#d7ff4f',
        'accent-dark': '#9fce1e',
        'accent-ink': '#0a0d00',
        success: '#6ee7a7',
        warning: '#fbbf24',
        danger: '#f87171',
        'energy-low': '#7dd3fc',
        'energy-medium': '#fbbf24',
        'energy-high': '#f87171',
      },
      fontFamily: {
        sans: ['Geist', 'System'],
        mono: ['GeistMono', 'Menlo'],
        serif: ['InstrumentSerif', 'Georgia'],
        'serif-italic': ['InstrumentSerifItalic', 'Georgia'],
      },
    },
  },
  plugins: [],
}
