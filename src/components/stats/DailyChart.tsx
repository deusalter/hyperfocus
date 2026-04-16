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
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const hasData = total > 0

  return (
    <div className="py-6" role="region" aria-label={`${label} chart`}>
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">{label}</h3>
        <span className="text-[11px] font-mono tabular-nums" style={{ color }}>
          {total}{unit}
        </span>
      </div>

      <table className="sr-only" aria-label={`${label}: ${total}${unit} total this week`}>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{day.dayLabel}</td>
              <td>{day.value}{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasData ? (
        <div className="flex items-end gap-2 sm:gap-3 h-32" aria-hidden="true">
          {data.map((day, i) => {
            const height = (day.value / maxValue) * 100
            const isActive = day.value > 0
            const isToday = i === data.length - 1

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group cursor-default">
                <span className={`text-[10px] font-mono tabular-nums transition-opacity ${isActive ? 'opacity-70 group-hover:opacity-100' : 'opacity-0'}`} style={{ color: isActive ? color : undefined }}>
                  {isActive ? `${day.value}${unit}` : ''}
                </span>
                <div className="w-full flex items-end h-[76px]">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, isActive ? 6 : 2)}%` }}
                    transition={{ duration: 0.65, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full"
                    style={{
                      background: isActive ? color : 'var(--color-border)',
                      opacity: isActive ? 1 : 0.4,
                    }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${isToday ? 'text-foreground' : 'text-muted'}`}>
                  {day.dayLabel}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-10">
          <p className="text-sm text-muted">Nothing yet this week.</p>
          <p className="text-xs text-muted/60 mt-1">Complete tasks or focus sessions to see your stats.</p>
        </div>
      )}
    </div>
  )
}
