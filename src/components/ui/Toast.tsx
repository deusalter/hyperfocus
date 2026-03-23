'use client'

import { createContext, useContext, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'undo'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  onUndo?: () => void
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, options?: { duration?: number; onUndo?: () => void }) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
  info: <Info className="w-4 h-4 text-accent shrink-0" />,
  undo: <Undo2 className="w-4 h-4 text-warning shrink-0" />,
}

const borderColors: Record<ToastVariant, string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-accent',
  undo: 'border-l-warning',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const duration = toast.duration ?? (toast.variant === 'undo' ? 5000 : 3000)

  return (
    <motion.div
      layout
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'glass-static relative overflow-hidden flex items-center gap-3 pl-4 pr-3 py-3 border-l-2 w-full md:min-w-[260px] md:max-w-[360px] md:w-auto',
        borderColors[toast.variant]
      )}
      style={{ boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)' }}
    >
      {icons[toast.variant]}
      <span className="text-sm text-foreground flex-1">{toast.message}</span>

      {toast.variant === 'undo' && toast.onUndo && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            toast.onUndo?.()
            onDismiss(toast.id)
          }}
          className="text-xs font-semibold text-warning hover:text-foreground px-2 py-1 rounded-lg border border-warning/30 hover:border-warning/60 transition-colors shrink-0"
        >
          Undo
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDismiss(toast.id)}
        className="text-muted hover:text-foreground transition-colors shrink-0 p-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </motion.button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          background: toast.variant === 'success' ? 'var(--color-success)'
            : toast.variant === 'error' ? 'var(--color-danger)'
            : toast.variant === 'undo' ? 'var(--color-warning)'
            : 'var(--color-accent)',
          opacity: 0.6,
        }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(toast.id)}
      />
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((
    message: string,
    variant: ToastVariant = 'success',
    options?: { duration?: number; onUndo?: () => void }
  ) => {
    const id = `toast-${++counterRef.current}`
    const newToast: Toast = {
      id,
      message,
      variant,
      duration: options?.duration,
      onUndo: options?.onUndo,
    }
    setToasts((prev) => [...prev, newToast].slice(-5)) // max 5 toasts
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-8 z-[60] flex flex-col gap-2 items-stretch md:items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
