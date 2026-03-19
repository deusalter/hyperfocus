'use client'

import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

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
    <div className="glass p-4 sm:p-5" role="region" aria-label={`${label} chart`}>
      <div className="flex items-baseline justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-muted uppercase tracking-wider">{label}</h3>
        <span className="text-[10px] sm:text-xs font-medium tabular-nums" style={{ color }}>
          {total}{unit} total
        </span>
      </div>

      {/* Screen reader accessible data table */}
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
        <div className="flex items-end gap-1.5 sm:gap-2 h-28 sm:h-32" aria-hidden="true">
          {data.map((day, i) => {
            const height = (day.value / maxValue) * 100
            const isActive = day.value > 0
            const isToday = i === data.length - 1

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                <span className={`text-[10px] text-muted tabular-nums transition-all duration-200 ${isActive ? 'opacity-70 group-hover:opacity-100' : 'opacity-0'}`}>
                  {isActive ? `${day.value}${unit}` : '-'}
                </span>
                <div className="w-full flex items-end h-[60px] sm:h-[80px]">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, isActive ? 8 : 2)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full rounded-t-lg transition-all duration-200 group-hover:brightness-125"
                    style={{
                      background: isActive
                        ? `linear-gradient(180deg, ${color}, ${color}CC)`
                        : 'var(--color-border)',
                      opacity: isActive ? 1 : 0.3,
                      boxShadow: isActive ? `0 -4px 12px ${color}33` : 'none',
                    }}
                  />
                </div>
                <span className={`text-[10px] transition-colors duration-200 ${isToday ? 'text-foreground font-medium' : 'text-muted'} group-hover:text-foreground`}>
                  {day.dayLabel}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-28 sm:h-32 text-center" role="status">
          <BarChart3 className="w-8 h-8 text-muted/30 mb-2" aria-hidden="true" />
          <p className="text-xs text-muted/60">No data yet this week</p>
          <p className="text-[10px] text-muted/40 mt-0.5">Complete tasks or focus sessions to see your stats</p>
        </div>
      )}
    </div>
  )
}
