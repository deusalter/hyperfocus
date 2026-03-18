# Hyperfocus

A productivity app designed **by someone with ADHD, for someone with ADHD**. Zero friction, dopamine-friendly, and beautiful.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Features

### Dashboard
- Time-based greeting (Good morning / afternoon / evening)
- Quick stats: tasks completed, focus time, current streak
- **Quick Capture** — type a thought and press Enter. Zero friction task entry.
- Today's task overview

### Task Management
- **Quick capture** with single-input task entry
- Categories: Today, Tomorrow, This Week, Someday
- Energy level tags (Low / Medium / High)
- **Brain Dump mode** — fullscreen text area to dump all thoughts, then convert to tasks
- Animated checkboxes with satisfying completion feedback
- Move tasks between categories

### Focus Timer
- Beautiful circular progress timer with SVG ring
- Presets: 15, 25, 45, and 60 minutes
- Start / Pause / Resume / Stop controls
- Link a task to your focus session
- **Ambient Mode** — fullscreen minimal timer with animated gradient background
- Break reminders with 5-minute break timer
- Session completion celebration with particle animation
- Focus session history

### Stats & Streaks
- Daily focus time chart (last 7 days)
- Daily tasks completed chart (last 7 days)
- Current streak and longest streak
- **Level system** based on total focus hours (Beginner → Legend)
- Weekly summary with tasks, focus time, and active days

### Settings
- Dark / Light theme toggle
- Sound effects toggle
- Default focus duration selector
- Data reset with confirmation

### Other
- PWA-ready (installable on desktop/mobile)
- Keyboard shortcuts: `N` = New Task, `T` = Timer, `D` = Dashboard, `S` = Stats
- Custom 404 page
- Smooth page transitions
- Mobile-responsive with bottom navigation bar
- All data stored in localStorage (no backend needed)

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation |
| **localStorage** | Data persistence |

## Design

- Dark mode by default with deep backgrounds
- Electric purple accent color
- Glassmorphism cards with backdrop blur
- Smooth 60fps animations throughout
- Satisfying micro-interactions on every button and checkbox

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
├── app/          # Next.js App Router pages
├── components/   # React components organized by feature
│   ├── layout/   # Sidebar, MobileNav, AppShell
│   ├── dashboard/ # Greeting, QuickStats, QuickCapture
│   ├── tasks/    # TaskList, TaskItem, BrainDump, CategoryTabs
│   ├── focus/    # TimerDisplay, TimerControls, AmbientMode
│   ├── stats/    # DailyChart, StreakDisplay, LevelBadge
│   └── ui/       # Card, Button, AnimatedCheckbox
├── hooks/        # Custom hooks (useTasks, useTimer, useStats, etc.)
├── lib/          # Types, utilities
└── styles/       # Global CSS
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Go to Dashboard |
| `N` | Go to Tasks (and focus input) |
| `T` | Go to Focus Timer |
| `S` | Go to Stats |

## Philosophy

This app follows ADHD-friendly design principles:

- **Zero friction** — Every interaction requires minimum executive function
- **Dopamine-friendly** — Satisfying animations, progress indicators, streaks
- **Not overwhelming** — Clean UI, minimal choices, progressive disclosure
- **Flexible** — No rigid systems that create guilt. Missed a day? No punishment.
- **Beautiful** — Polished, modern UI that makes you want to open it
