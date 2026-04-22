export type TaskCategory = 'today' | 'tomorrow' | 'week' | 'someday'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type TaskType = 'deep' | 'admin' | 'creative'
export type TaskWeight = 'S' | 'M' | 'L'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  completed: boolean
  completedAt?: string
  createdAt: string
  energyLevel?: EnergyLevel
  timeEstimate?: number
  order: number
  // v2 additions — optional during migration, defaulted on any read that needs them
  type?: TaskType
  weight?: TaskWeight
  due?: string
}

export interface FocusSession {
  id: string
  taskId?: string
  taskTitle?: string
  duration: number
  actualDuration: number
  completedAt: string
  completed: boolean
}

export interface Settings {
  theme: 'dark' | 'light'
  defaultFocusDuration: number
  soundEnabled: boolean
}

// Computed per-day summary used by shadow-self racing.
export interface DaySummary {
  dateISO: string             // YYYY-MM-DD
  dayOfWeek: number           // 0 (Sun) - 6 (Sat)
  focusSeconds: number
  tasksCompleted: number
  score: number               // weighted score (deep/creative/admin multipliers)
  sessionStarts: { startISO: string; durationSec: number }[]
}
