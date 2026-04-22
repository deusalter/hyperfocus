# Hyperfocus

A mobile productivity app for ADHD brains — built by one.

Most task apps punish you. Miss a day and the streak dies, the red numbers pile up, the UI nags. Hyperfocus goes the other way: capture without friction, focus without ceremony, and if you miss a day, nothing breaks. The central mechanic is **shadow-self racing** — you race your own past performance in real time. Last Tuesday-you started a session at 9:04am and hit 2h 15m of focus. This Tuesday-you is at 45m. That pressure is the point.

## Stack

React Native · Expo · Expo Router · NativeWind · React Native Reanimated · React Native SVG · AsyncStorage

The repo used to be a Next.js web app (see git history before the pivot commit). It was rebuilt on Expo because ADHD tools need to be on your phone, with you, not at a desktop. Shadow-self with lock-screen widgets and background focus timers only works native.

## Getting started

```bash
npm install --legacy-peer-deps
npx expo start
```

Press `i` to open the iOS Simulator, `a` for Android, or scan the QR code with the Expo Go app on a real device.

## Project shape

```
app/                     # Expo Router screens (file-based routing)
├── _layout.tsx          # Root stack: SafeAreaProvider, GestureHandler, StatusBar
└── (tabs)/
    ├── _layout.tsx      # Bottom tabs: Today / Tasks / Focus / Settings
    ├── index.tsx        # Today (dashboard, shadow-self live race)
    ├── tasks.tsx        # Task triage
    ├── focus.tsx        # Timer
    └── settings.tsx     # Preferences + BYOK later

src/
├── lib/                 # Types + pure utility functions
└── hooks/               # useTasks, useTimer, useStats, useLocalStorage, useScrambleText

global.css               # NativeWind entry (tailwind directives)
tailwind.config.js       # Color tokens + font families
app.json                 # Expo config
```

## Design

Editorial-dark. Ink-black background (`#07070a`), off-white type, a single electric lime accent (`#c5f82a`). Light mode swaps to warm paper cream with a moss-green accent for legibility. Instrument Serif italic for display numerals; Geist for UI. Motion is quiet — digit-stack odometers for stats, single-pulse completion rings. All of it degrades cleanly under "Reduce Motion."

## Philosophy

- **Zero friction.** Capture is one keystroke away on every screen.
- **Not overwhelming.** Flat surfaces, hairline borders, one accent, progressive disclosure.
- **No punishment.** Miss a day and nothing gets angry at you.
- **Race, don't score.** Shadow-self > streak counter. Competition beats monotonic progress bars for ADHD brains specifically.

## Status

Scaffold + data layer ported. UI rebuild in progress — placeholder tab screens for now. Shadow-self racing and AI-assisted task breakdown coming next.
