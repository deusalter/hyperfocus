'use client'

import { motion } from 'framer-motion'

interface DailyChartProps {
  data: { date: string; value: number; dayLabel: string }[]
  label: string
  color: string
  unit: string
}

export default function DailyChart({ data, label, color, unit }: DailyChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">{label}</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((day, i) => {
          const height = (day.value / maxValue) * 100
          const isActive = day.value > 0

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[10px] text-muted tabular-nums transition-colors group-hover:text-foreground">
                {isActive ? `${day.value}${unit}` : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, isActive ? 8 : 2)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full rounded-t-lg transition-shadow duration-200"
                  style={{
                    background: isActive
                      ? `linear-gradient(180deg, ${color}, ${color}CC)`
                      : 'var(--color-border)',
                    opacity: isActive ? 1 : 0.3,
                    boxShadow: isActive ? `0 -4px 12px ${color}33` : 'none',
                  }}
                />
              </div>
              <span className="text-[10px] text-muted">{day.dayLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
