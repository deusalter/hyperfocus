# Hyperfocus

A productivity app designed **by someone with ADHD, for someone with ADHD**. Zero friction, dopamine-friendly, and beautiful.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Framer Motion.

## Features

### Dashboard
- Time-based greeting (Good morning / afternoon / evening / night)
- Quick stats: tasks completed today, focus time, current streak
- **Quick Capture** — type a thought and press Enter. Zero friction task entry.
- Today's task overview with energy level badges

### Task Management
- **Quick capture** with single-input task entry
- Categories: Today, Tomorrow, This Week, Someday
- Energy level tags (Low / Medium / High) with color-coded borders
- **Brain Dump mode** — fullscreen text area to dump all thoughts, then convert to tasks
- Animated checkboxes with sparkle particles on completion
- Swipe-to-delete on mobile, hover actions on desktop
- Move tasks between categories with one tap
- Undo delete with toast notification

### Focus Timer
- Beautiful circular progress timer with SVG ring and tick marks
- Presets: 15, 25, 45, and 60 minutes
- Start / Pause / Resume / Stop controls
- Link a task to your focus session
- **Ambient Mode** — fullscreen minimal timer with animated gradient background
- Break reminders with 5-minute break timer
- Session completion celebration with particle animation
- Focus session history with completion status

### Stats & Streaks
- Daily focus time bar chart (last 7 days)
- Daily tasks completed bar chart (last 7 days)
- Current streak and longest streak with animated counters
- **Level system** based on total focus hours (Beginner → Transcendent, 9 levels)
- Weekly summary with tasks, focus time, and active days

### Settings
- Dark / Light theme toggle with animated switch
- Sound effects toggle
- Default focus duration selector (15 / 25 / 30 / 45 / 60 min)
- Data reset with confirmation dialog

### Accessibility
- Skip-to-content link for keyboard navigation
- ARIA roles, labels, and live regions throughout
- Focus trap in modals with Escape key to close
- `aria-pressed` on toggle buttons, `aria-checked` on checkboxes
- Screen reader data table in charts
- Keyboard task management (Delete to remove, Arrow keys to move)
- Respects `prefers-reduced-motion` — all decorative animations disabled
- Global focus-visible ring for keyboard users

### Other
- PWA-ready (installable on desktop/mobile)
- Keyboard shortcuts: `N` = New Task, `T` = Timer, `D` = Dashboard, `S` = Stats
- Toast notifications with undo support
- Skeleton loading screens for every page
- Custom 404 page and error boundary
- Smooth page transitions with AnimatePresence
- Mobile-responsive with bottom navigation bar
- Glassmorphism design with noise texture overlays
- All data stored in localStorage (no backend needed)

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library with compiler |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations, gestures, and transitions |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation |
| **localStorage** | Client-side data persistence |

## Design

- Dark mode by default with light mode support
- Electric purple accent color (#8b5cf6)
- Glassmorphism cards with backdrop blur and noise texture
- Smooth 60fps animations throughout
- Satisfying micro-interactions: ripple buttons, sparkle checkboxes, spring-animated numbers
- Responsive: mobile-first with bottom nav, desktop sidebar

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/              # Next.js App Router pages & global styles
│   ├── page.tsx      # Dashboard
│   ├── focus/        # Focus timer
│   ├── tasks/        # Task management
│   ├── stats/        # Statistics & streaks
│   ├── settings/     # App settings
│   ├── globals.css   # CSS variables, glass utilities, animations
│   ├── error.tsx     # Error boundary
│   └── not-found.tsx # 404 page
├── components/       # React components organized by feature
│   ├── layout/       # AppShell, Sidebar, MobileNav
│   ├── dashboard/    # Greeting, QuickStats, QuickCapture, TodayTasks
│   ├── tasks/        # AddTask, TaskList, TaskItem, CategoryTabs, BrainDump
│   ├── focus/        # TimerDisplay, TimerControls, TimerPresets, AmbientMode, SessionComplete, SessionHistory
│   ├── stats/        # DailyChart, StreakDisplay, LevelBadge, WeeklySummary
│   └── ui/           # Button, Card, AnimatedCheckbox, AnimatedNumber, Toast, ScrollReveal, Skeleton
├── hooks/            # Custom hooks (useTasks, useTimer, useStats, useLocalStorage, useKeyboardShortcuts)
└── lib/              # TypeScript types & utility functions
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Go to Dashboard |
| `N` | Go to Tasks (and focus input) |
| `T` | Go to Focus Timer |
| `S` | Go to Stats |
| `Delete` | Delete focused task |
| `→` | Move focused task to next category |
| `Esc` | Close modals and ambient mode |

## Philosophy

This app follows ADHD-friendly design principles:

- **Zero friction** — Every interaction requires minimum executive function
- **Dopamine-friendly** — Satisfying animations, progress indicators, streaks, and celebrations
- **Not overwhelming** — Clean UI, minimal choices, progressive disclosure
- **Flexible** — No rigid systems that create guilt. Missed a day? No punishment.
- **Beautiful** — Polished, premium UI that makes you want to open it
