'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { FocusSession } from '@/lib/types'
import { formatMinutes } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface SessionHistoryProps {
  sessions: FocusSession[]
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const recentSessions = sessions.slice(0, 10)

  if (recentSessions.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Recent Sessions</h3>
        <div className="glass p-8 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%)',
            }}
          />
          <Timer className="w-8 h-8 text-muted/30 mx-auto mb-2 relative z-10" />
          <p className="text-sm text-muted relative z-10">No sessions yet.</p>
          <p className="text-xs text-muted/60 mt-1 relative z-10">Start your first focus session above!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Recent Sessions</h3>
      <div className="space-y-2">
        {recentSessions.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass flex items-center gap-3 px-4 py-3"
            style={session.completed ? {
              borderLeft: '2px solid var(--color-success)',
            } : undefined}
          >
            {session.completed ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm block truncate">
                {session.taskTitle || 'Focus session'}
              </span>
              <span className="text-xs text-muted">
                {format(parseISO(session.completedAt), 'MMM d, h:mm a')}
              </span>
            </div>
            <span className="text-sm font-medium tabular-nums flex items-center gap-1" style={{
              color: session.completed ? 'var(--color-success)' : 'var(--color-muted)',
            }}>
              <Clock className="w-3 h-3" />
              {formatMinutes(Math.round(session.actualDuration / 60))}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
