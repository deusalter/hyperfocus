export interface Task {
  id: string
  title: string
  category: 'today' | 'tomorrow' | 'week' | 'someday'
  completed: boolean
  completedAt?: string
  createdAt: string
  energyLevel?: 'low' | 'medium' | 'high'
  timeEstimate?: number
  order: number
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

export interface UserStats {
  totalFocusMinutes: number
  currentStreak: number
  longestStreak: number
  level: number
  lastActiveDate: string
}

export interface Settings {
  theme: 'dark' | 'light'
  defaultFocusDuration: number
  soundEnabled: boolean
}

export type TaskCategory = Task['category']
export type EnergyLevel = NonNullable<Task['energyLevel']>
