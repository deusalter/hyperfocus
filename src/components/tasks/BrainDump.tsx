'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, X, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BrainDumpProps {
  onDump: (text: string) => number
}

export default function BrainDump({ onDump }: BrainDumpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleDump = () => {
    if (!text.trim()) return
    const count = onDump(text)
    setResult(count)
    setText('')
    setTimeout(() => {
      setResult(null)
      setIsOpen(false)
    }, 1800)
  }

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Brain className="w-4 h-4" />
        Brain dump
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="brain-dump-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass-static w-full max-w-lg p-5 sm:p-7 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="brain-dump-title"
                  className="display-xl text-[28px]"
                >
                  Brain dump
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted mb-4">
                Empty your head. One thought per line. They&apos;ll become tasks.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Email professor\nGroceries\nFinish the draft\nCall mom"}
                className="w-full h-44 sm:h-52 bg-background rounded-lg p-3 sm:p-4 text-[15px] text-foreground placeholder-muted/40 outline-none resize-none border border-border focus:border-accent transition-colors"
                aria-label="Brain dump thoughts, one per line"
                autoFocus
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted font-mono tabular-nums" aria-live="polite">
                  {text.split('\n').filter((l) => l.trim()).length} lines
                </span>

                <AnimatePresence mode="wait">
                  {result !== null ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium text-accent"
                      role="status"
                    >
                      {result} created.
                    </motion.div>
                  ) : (
                    <Button onClick={handleDump} disabled={!text.trim()}>
                      Convert <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
