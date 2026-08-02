# Hyperfocus

A mobile productivity app for ADHD brains — built by one.

Most task apps punish you. Miss a day and the streak dies, the red numbers pile up, the UI nags. Hyperfocus goes the other way: capture without friction, focus without ceremony, and if you miss a day, nothing breaks.

The central mechanic is **racing your recent selves** — a field of your last several active days runs on the track with you, and the target is a *typical* day rather than your best one. You pass some of them on almost any day, which is the point.

## Stack

React Native · Expo SDK 54 · Expo Router · NativeWind · React Native Reanimated · React Native SVG · AsyncStorage

The repo used to be a Next.js web app (see git history before the pivot commit). It was rebuilt on Expo because ADHD tools need to be on your phone, with you, not at a desktop.

## Getting started

```bash
npm install --legacy-peer-deps
npx expo start
```

Press `i` to open the iOS Simulator, `a` for Android, or scan the QR code with the Expo Go app on a real device.

## Project shape

```
app/                     # Expo Router screens (file-based routing)
├── _layout.tsx          # Root stack, fonts, error boundary, onboarding gate
├── onboarding.tsx       # 3-step first run
├── dump.tsx             # Brain dump (modal)
├── triage.tsx           # Swipe sort: Today / Later / Let go (modal)
├── focus.tsx            # Session timer + progress ring
├── recap.tsx            # Post-session
├── debrief.tsx          # Weekly review (modal)
└── (tabs)/
    ├── _layout.tsx      # Glass tab bar + capture FAB
    ├── index.tsx        # Home: the race, momentum, today's list
    ├── calendar.tsx     # Week strip, navigable
    ├── insights.tsx     # Companion, weekly momentum chart
    └── you.tsx          # Profile + preferences

src/
├── store/AppStore.tsx   # All state: tasks, history, settings, focus session
├── lib/
│   ├── points.ts        # Scoring, day totals, the race field
│   ├── motion.ts        # The motion vocabulary (read this before animating)
│   ├── theme.ts         # Palette, categories, fonts
│   └── types.ts
└── components/
    ├── Sprite.tsx       # The companion
    ├── home/RaceCard.tsx
    └── ui/              # PressableScale, Toggle, ScreenHeader
```

## Design

Light editorial. Warm off-white ground (`#eef0f0`), near-black ink, one slate-blue accent (`#4f7aa6`) with a warm secondary. Hanken Grotesk for UI, Spline Sans Mono for numerals.

**Motion has two rules**, both in `src/lib/motion.ts`:

1. **Nothing loops.** Motion onset captures attention involuntarily — focus can't suppress it — so a looping animation re-grabs the user every cycle. Ambient motion running alongside content past 5s is also a WCAG 2.2.2 Level A failure. Celebration is a burst that ends. The companion animates while it has something to say, then holds its pose.
2. **Overshoot is an attention budget.** Visible bounce draws the eye to the motion itself, so it's spent only on earned moments, never on routine reflow.

Everything degrades under Reduce Motion.

## Philosophy

- **Zero friction.** Capture is one tap away on every screen. Nothing to configure before it's useful.
- **Not overwhelming.** Flat surfaces, hairline borders, one accent, progressive disclosure. Today is soft-capped at five.
- **No punishment.** No streak to break, no accumulating failure counter. Days you showed up only ever counts up.
- **Race a field, not a bar.** Racing a single past day ratchets — a good day sets a target you must then clear, so success guarantees a later failure. The field gives graded credit instead, and the pacer is a median day, never a record.
- **Starting is the thing being rewarded.** A score built only from elapsed minutes measures how much time you had, not what it cost you to begin. Each completion banks a fixed reward for having started, and focused minutes count full value up to a session length before tapering — so deep work still earns the most of any single completion without a long block dwarfing a day made of several starts.
- **Descriptive, not evaluative.** A shortfall is a distance to cover, never a verdict on the day.
- **Coming back is free.** After a gap the app greets you with zero debt and one small action, because the screen shown after an absence decides whether there's another one.

## Accessibility

Text clears WCAG AA (4.5:1) throughout while deliberately staying short of maximal contrast — pure black on pure white is a documented source of visual stress, so the palette is near-black ink on warm off-white. Touch targets meet Apple's 44pt, with asymmetric `hitSlop` where controls sit close enough that uniform slop would overlap. All motion degrades under Reduce Motion.

## Status

Core loop is complete and running: capture → triage → focus → recap → race → weekly debrief.

Not yet wired (shown as "Soon" in-app): reminders, focus sounds, Canvas import. Lock-screen widgets and Live Activities are the natural next step for a timer this app wants you to trust in the background.
