'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
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
      <div className="mt-12">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-3">
          Sessions
        </h3>
        <p className="display-xl text-[26px] text-muted-strong">No sessions yet.</p>
        <p className="text-sm text-muted mt-1">Start your first run above.</p>
      </div>
    )
  }

  return (
    <div className="mt-12">
      <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted mb-3">
        Sessions
      </h3>
      <ul className="divide-y divide-border border-t border-border">
        {recentSessions.map((session, i) => (
          <motion.li
            key={session.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className="flex items-center gap-3 py-3"
          >
            {session.completed ? (
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[14px] block truncate">
                {session.taskTitle || 'Focus session'}
              </span>
              <span className="text-[10px] font-mono text-muted">
                {format(parseISO(session.completedAt), 'MMM d · h:mm a')}
              </span>
            </div>
            <span
              className="text-[13px] font-mono tabular-nums shrink-0"
              style={{ color: session.completed ? 'var(--color-foreground)' : 'var(--color-muted)' }}
            >
              {formatMinutes(Math.round(session.actualDuration / 60))}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
