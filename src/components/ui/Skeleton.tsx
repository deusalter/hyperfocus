'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface',
        className
      )}
    />
  )
}

export function TaskSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass p-4 flex flex-col items-center">
          <Skeleton className="w-10 h-10 rounded-xl mb-2" />
          <Skeleton className="w-12 h-6 mb-1" />
          <Skeleton className="w-16 h-3" />
        </div>
      ))}
    </div>
  )
}
