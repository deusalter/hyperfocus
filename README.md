# Hyperfocus

A productivity app for ADHD brains — built by one.

Most task apps punish you. Miss a day and the streak dies, the red numbers pile up, the UI nags. Hyperfocus goes the other way: capture without friction, focus without ceremony, and if you miss a day, nothing breaks. It's meant to be opened when your brain is already full, not when you're in an "I'm going to get organized" mood.

## What it does

**Capture.** One input on the dashboard. Type what's in your head, press Enter, it's saved. No categorization, no priority dropdown, no modal. The bar at the top of the app is the fastest path from thought to saved.

**Focus.** A timer that respects you being on it. Pick a preset (15 / 25 / 45 / 60), optionally pin a task to the session, and go. The ring doesn't strobe at you. Once a minute, it sends a single soft pulse outward — a heartbeat, not a notification. Press the expand icon and the whole screen goes black with just the remaining time in it. That's ambient mode.

**Triage.** When you're ready to sort, the Tasks page has four buckets: Today, Tomorrow, This Week, Someday. Tasks get an optional energy tag (low / medium / high) so you can match them to what you've got. Swipe left to delete (mobile), drag right to the next bucket, or use the keyboard — Delete removes the focused task, → moves it.

**Brain dump.** When your head is loud, open the brain dump modal and type every thought on its own line. Hit convert. They all become tasks. No editing ceremony — you can always polish them later, or just mark them done.

**Signal, not guilt.** The Stats page shows your level (nine tiers, based on lifetime focus minutes), current and longest streaks, and the last seven days as two small bar charts. There's no weekly goal, no "you missed Tuesday" callout. Just the numbers.

## Design

Editorial-dark. Ink-black background (`#07070a`), off-white type, a single electric lime accent (`#c5f82a`) that appears only where it matters: active navigation, the timer ring, the focus indicator, a period at the end of the page title. No purple gradients, no glassmorphism, no layered cards. Surfaces are flat, separated by 1px hairlines.

Typography is Geist for UI, Instrument Serif italic for display numerals and page titles, and Geist Mono for eyebrows and kbd hints.

Motion is quiet on purpose. The greeting text scrambles in once, stat numbers roll digit-by-digit like an odometer, page transitions are a left-to-right clip-path reveal, and completed sessions exit with a single expanding ring. All of it degrades cleanly when you've got `prefers-reduced-motion` on.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Data is stored in `localStorage` — there's no backend, no account, no sync. That's on purpose: the app works offline, nothing leaves your device, and there's no login friction.

## Tech

Built on Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, and Framer Motion 12. Icons are Lucide. Dates are `date-fns`. It's PWA-installable on desktop and mobile.

## Keyboard

| Key | What it does |
|---|---|
| `D` | Dashboard |
| `N` | Tasks (focuses the add input) |
| `T` | Focus timer |
| `S` | Stats |
| `Enter` | Save the task in the capture bar |
| `Delete` | Remove the focused task |
| `→` | Move the focused task to the next bucket |
| `Esc` | Close modals and ambient mode |

## Accessibility

The app is built to be usable with just a keyboard. Every interactive element has an accessible name, the skip link works, toggles expose `aria-pressed`/`aria-checked`, charts include an `sr-only` data table, and modals trap focus with Escape to close. Decorative motion is disabled under `prefers-reduced-motion`.

## Philosophy

Four rules the app follows:

- **Zero friction.** The fastest thing should be the most common thing. Capture is one keystroke away on every page.
- **Dopamine-friendly, not dopamine-overloading.** Satisfying micro-moments (the odometer roll, the pulse at session end) — but no sparkle storms, no confetti cannons.
- **Not overwhelming.** Flat surfaces, generous whitespace, one accent color, progressive disclosure. If a setting isn't earning its keep, it's not there.
- **No punishment.** Miss a day and your streak resets, but nothing gets angry at you about it. The rest of the app looks identical.

## Project shape

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── tasks/, focus/, stats/, settings/
│   ├── globals.css         # Tokens, surfaces, motion
│   ├── error.tsx, not-found.tsx
│   └── layout.tsx
├── components/
│   ├── layout/             # AppShell, Sidebar, MobileNav
│   ├── dashboard/          # Greeting, QuickStats, QuickCapture, TodayTasks
│   ├── tasks/              # AddTask, TaskList, TaskItem, CategoryTabs, BrainDump
│   ├── focus/              # TimerDisplay, TimerControls, Presets, Ambient, Complete, History
│   ├── stats/              # DailyChart, StreakDisplay, LevelBadge, WeeklySummary
│   └── ui/                 # Button, Card, Checkbox, Odometer, Toast, Skeleton
├── hooks/                  # useTasks, useTimer, useStats, useLocalStorage,
│                           # useKeyboardShortcuts, useScrambleText
└── lib/                    # types, utils
```

The design system lives entirely in `src/app/globals.css` — tokens up top, surface primitives in the middle, motion at the bottom. Reskinning is a CSS edit, not a component rewrite.
