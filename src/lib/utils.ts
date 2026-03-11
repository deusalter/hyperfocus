export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function getLevelFromMinutes(totalMinutes: number): { level: number; title: string; nextLevelMinutes: number; progress: number } {
  const levels = [
    { min: 0, title: 'Beginner' },
    { min: 60, title: 'Starter' },
    { min: 180, title: 'Focused' },
    { min: 420, title: 'Dedicated' },
    { min: 900, title: 'Committed' },
    { min: 1800, title: 'Expert' },
    { min: 3600, title: 'Master' },
    { min: 6000, title: 'Legend' },
    { min: 10000, title: 'Transcendent' },
  ]

  let currentLevel = 0
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalMinutes >= levels[i].min) {
      currentLevel = i
      break
    }
  }

  const nextLevel = currentLevel < levels.length - 1 ? levels[currentLevel + 1] : null
  const currentMin = levels[currentLevel].min
  const nextMin = nextLevel ? nextLevel.min : levels[currentLevel].min
  const progress = nextLevel
    ? Math.min(((totalMinutes - currentMin) / (nextMin - currentMin)) * 100, 100)
    : 100

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelMinutes: nextMin,
    progress,
  }
}

export function getDayKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}
