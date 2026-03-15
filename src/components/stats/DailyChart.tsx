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

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted tabular-nums">
                {day.value > 0 ? `${day.value}${unit}` : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, day.value > 0 ? 8 : 2)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="w-full rounded-t-md"
                  style={{
                    backgroundColor: day.value > 0 ? color : 'var(--color-border)',
                    opacity: day.value > 0 ? 1 : 0.3,
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
