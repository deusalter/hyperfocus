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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass p-8 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%)',
            }}
          />
          <motion.div
            animate={{
              y: [0, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="mx-auto mb-3 relative z-10 w-fit"
          >
            <Timer className="w-8 h-8 text-muted/40" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-muted relative z-10"
          >
            No sessions yet.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs text-muted/60 mt-1 relative z-10"
          >
            Start your first focus session above!
          </motion.p>
        </motion.div>
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
            className="glass flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3"
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
              <span className="text-xs sm:text-sm block truncate">
                {session.taskTitle || 'Focus session'}
              </span>
              <span className="text-[10px] sm:text-xs text-muted">
                {format(parseISO(session.completedAt), 'MMM d, h:mm a')}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-medium tabular-nums flex items-center gap-1 shrink-0" style={{
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
