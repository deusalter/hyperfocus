# Hyperfocus

A mobile productivity app for ADHD brains — built by one.

Most task apps punish you. Miss a day and the streak dies, the red numbers pile up, the UI nags. Hyperfocus goes the other way: capture without friction, focus without ceremony, and if you miss a day, nothing breaks.

The central mechanic is **racing your recent selves** — a field of your last several active days runs on the track with you, and the target is a *typical* day rather than your best one. You pass some of them on almost any day, which is the point.

## Stack

React Native · Expo SDK 54 · Expo Router · NativeWind · React Native Reanimated · React Native SVG · AsyncStorage · expo-notifications · expo-audio

The repo used to be a Next.js web app (see git history before the pivot commit). It was rebuilt on Expo because ADHD tools need to be on your phone, with you, not at a desktop.

## Getting started

```bash
npm install --legacy-peer-deps
npx expo start
```

Press `i` for the iOS Simulator (needs Xcode), `a` for Android, or `w` for the browser. The web build matches the phone closely and is what the end-to-end checks and store screenshots use. Expo Go from the App Store only runs the newest Expo SDK, so on a real iPhone use a TestFlight build.

## Checks

```bash
npm run verify        # types, lint, unit and routing tests
npx expo start --web --port 8099   # then, in another terminal:
npm run e2e           # every user flow, driven headlessly against the real store
```

The real Release app runs on iOS simulators through `gh workflow run ios-simulator.yml`, on GitHub's macOS runners: every flow, the largest text size, an iPhone SE, a phone set to dark, and App Store screenshots captured from the app itself. No Xcode or Apple account needed. What still needs a real phone (notification delivery, sound, haptics, listening with VoiceOver) is in `store/RELEASE.md`.

## Project shape

```
app/                     # Expo Router screens (file-based routing)
├── _layout.tsx          # Root stack, fonts, error boundary, startup gate
├── onboarding.tsx       # 3-step first run
├── dump.tsx             # Brain dump (modal)
├── triage.tsx           # Swipe sort: Today / Later / Let go (modal)
├── task/[id].tsx        # Edit one task: title, first move, kind, date, list (modal)
├── focus.tsx            # Session timer + progress ring
├── recap.tsx            # Post-session
├── debrief.tsx          # Weekly review (modal)
└── (tabs)/
    ├── _layout.tsx      # Glass tab bar + capture FAB
    ├── index.tsx        # Home: the race, momentum, today's list
    ├── calendar.tsx     # Week strip, what's due and what got finished
    ├── insights.tsx     # Companion, weekly momentum chart
    └── you.tsx          # Profile, sounds, reminders, import, about

src/
├── store/AppStore.tsx   # All state, and the one place a session's clock is watched
├── lib/
│   ├── points.ts        # Scoring, day totals, the race field
│   ├── session.ts       # Pure session rules: remaining, adjust, credit
│   ├── tasks.ts         # Bucketing, what to suggest next, date labels
│   ├── feed.ts          # Calendar feeds: .ics parsing and merging
│   ├── reminders.ts     # What the daily nudge says and when
│   ├── notifications.ts # Local notifications
│   ├── sound.ts         # Focus sounds
│   ├── motion.ts        # The motion vocabulary (read this before animating)
│   ├── theme.ts         # Palette, categories, fonts
│   └── types.ts
└── components/
    ├── Sprite.tsx       # The companion
    ├── UndoToast.tsx
    ├── WeekStrip.tsx
    ├── home/            # RaceCard, TaskRow
    └── ui/              # PressableScale, Toggle, ScreenHeader, Icon

store/                   # App Store listing, release checklist, screenshots
docs/                    # Published site: privacy policy and support
scripts/                 # End-to-end checks and the screenshot pipeline
```

## Design

Light editorial. Warm off-white ground (`#eef0f0`), near-black ink, one slate-blue accent (`#456a90`) with a warm secondary. Hanken Grotesk for UI, Spline Sans Mono for numerals. Light is the designed look and the default; a dark theme and "match my phone" are there to choose under You.

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
- **Undo beats "are you sure?"** Impulsive taps are a fact of life here. Quick actions take effect immediately and offer a way back, rather than adding a decision to every action to guard against a rare mistake.
- **The clock running out doesn't mean the work did.** Only you can say a task is finished. When time's up the app keeps the task and asks.
- **Coming back is free.** After a gap the app greets you with zero debt and one small action, because the screen shown after an absence decides whether there's another one.

## Accessibility

Text clears WCAG AA (4.5:1) throughout, in both themes, which `npm run e2e` measures on every screen from what actually renders. It deliberately stays short of maximal contrast — pure black on pure white is a documented source of visual stress, so the palette is near-black ink on warm off-white. Touch targets meet Apple's 44pt, with asymmetric `hitSlop` where controls sit close enough that uniform slop would overlap. All motion degrades under Reduce Motion, the tab bar goes solid under Reduce Transparency, and Gentle mode removes every comparison for anyone who finds even a kindly worded one stressful. Buttons, charts and the race are labelled for VoiceOver.

## Privacy

No accounts, no servers, no analytics. Everything lives in on-device storage. The only network request the app ever makes is reading a calendar link the user chose to connect, directly from wherever that link points. Notifications are scheduled locally. See [the privacy policy](https://deusalter.github.io/hyperfocus/privacy.html).

## Status

The full loop works: capture → triage → focus → recap → race → weekly debrief, with session alerts, a daily nudge, focus sounds, and Canvas or any calendar feed. Getting it onto the App Store is a checklist in [`store/RELEASE.md`](store/RELEASE.md).

Lock Screen widgets and Live Activities are the natural next step for a timer this app wants you to trust in the background.
