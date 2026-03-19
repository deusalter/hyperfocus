'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface relative overflow-hidden',
        className
      )}
    >
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
  )
}

export function TaskSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="glass flex items-center gap-3 px-4 py-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
          <Skeleton className="w-12 h-5 rounded-md ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="glass p-4 flex flex-col items-center"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <Skeleton className="w-10 h-10 rounded-xl mb-2" />
          <Skeleton className="w-12 h-6 mb-1" />
          <Skeleton className="w-16 h-3" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Quick stats skeleton */}
      <StatsSkeleton />

      {/* Divider */}
      <div className="divider-glow" />

      {/* Quick capture skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Today tasks skeleton */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <TaskSkeleton />
      </div>
    </div>
  )
}

export function FocusSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Presets */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-16 rounded-xl" />
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex justify-center py-8">
        <Skeleton className="w-64 h-64 rounded-full" />
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  )
}

export function TaskPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Add task */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Category tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-xl" />
        ))}
      </div>

      {/* Task list */}
      <TaskSkeleton />
    </div>
  )
}
