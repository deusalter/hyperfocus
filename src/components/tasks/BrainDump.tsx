'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, X, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BrainDumpProps {
  onDump: (text: string) => number
}

export default function BrainDump({ onDump }: BrainDumpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<number | null>(null)

  const handleDump = () => {
    if (!text.trim()) return
    const count = onDump(text)
    setResult(count)
    setText('')
    setTimeout(() => {
      setResult(null)
      setIsOpen(false)
    }, 2000)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-muted"
      >
        <Brain className="w-4 h-4" />
        Brain Dump
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold">Brain Dump</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted mb-3">
                Write everything on your mind. One thought per line. They&apos;ll become tasks.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Buy groceries&#10;Email professor&#10;Finish assignment&#10;Call mom..."
                className="w-full h-48 bg-surface rounded-xl p-4 text-sm text-foreground placeholder-muted/40 outline-none resize-none border border-border focus:border-accent/30 transition-colors"
                autoFocus
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted">
                  {text.split('\n').filter((l) => l.trim()).length} thoughts
                </span>

                <AnimatePresence mode="wait">
                  {result !== null ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1 text-success text-sm font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      {result} tasks created!
                    </motion.div>
                  ) : (
                    <Button onClick={handleDump} disabled={!text.trim()}>
                      <Sparkles className="w-4 h-4" />
                      Convert to Tasks
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
