'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Settings } from '@/lib/types'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const defaultSettings: Settings = {
  theme: 'dark',
  defaultFocusDuration: 25,
  soundEnabled: true,
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <motion.button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      whileTap={{ scale: 0.97 }}
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 border"
      style={{
        background: checked ? 'var(--color-accent)' : 'transparent',
        borderColor: checked ? 'var(--color-accent)' : 'var(--color-border-hover)',
      }}
    >
      <motion.div
        className="w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2"
        style={{ background: checked ? 'var(--color-accent-ink)' : 'var(--color-muted-strong)' }}
        animate={{ x: checked ? 22 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </motion.button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<Settings>('hyperfocus-settings', defaultSettings)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const resetDialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showResetConfirm) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResetConfirm(false)
      if (e.key === 'Tab') {
        const dialog = resetDialogRef.current
        if (!dialog) return
        const focusable = dialog.querySelectorAll<HTMLElement>('button')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResetConfirm])

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    setSettings({ ...settings, theme: newTheme })
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleSound = () => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })
  const setFocusDuration = (minutes: number) => setSettings({ ...settings, defaultFocusDuration: minutes })

  const resetAllData = () => {
    localStorage.removeItem('hyperfocus-tasks')
    localStorage.removeItem('hyperfocus-sessions')
    localStorage.removeItem('hyperfocus-settings')
    setShowResetConfirm(false)
    window.location.reload()
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="display-xl text-[44px] sm:text-[56px]">Settings<span style={{ color: 'var(--color-accent)' }}>.</span></h1>
        <p className="text-sm text-muted mt-1">Fewer knobs is the feature.</p>
      </motion.div>

      <div className="max-w-lg divide-y divide-border border-y border-border">
        <div className="flex items-center justify-between py-5">
          <div>
            <span className="text-[15px] font-medium block">Theme</span>
            <span className="text-xs text-muted capitalize">{settings.theme} mode</span>
          </div>
          <Toggle
            checked={settings.theme === 'dark'}
            onChange={toggleTheme}
            label={`Dark mode, currently ${settings.theme === 'dark' ? 'enabled' : 'disabled'}`}
          />
        </div>

        <div className="flex items-center justify-between py-5">
          <div>
            <span className="text-[15px] font-medium block">Sound</span>
            <span className="text-xs text-muted">{settings.soundEnabled ? 'On' : 'Off'}</span>
          </div>
          <Toggle
            checked={settings.soundEnabled}
            onChange={toggleSound}
            label={`Sound effects, currently ${settings.soundEnabled ? 'enabled' : 'disabled'}`}
          />
        </div>

        <div className="py-5">
          <div className="mb-3">
            <span className="text-[15px] font-medium block">Default focus duration</span>
            <span className="text-xs text-muted tabular-nums">{settings.defaultFocusDuration} minutes</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Focus duration options">
            {[15, 25, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setFocusDuration(mins)}
                aria-pressed={settings.defaultFocusDuration === mins}
                aria-label={`${mins} minutes`}
                className={cn(
                  'px-3 py-1.5 text-sm font-mono rounded-full border transition-colors',
                  settings.defaultFocusDuration === mins
                    ? 'border-accent text-accent'
                    : 'border-border text-muted hover:text-foreground hover:border-border-hover'
                )}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-5">
          <div className="min-w-0">
            <span className="text-[15px] font-medium block">Reset everything</span>
            <span className="text-xs text-muted">Tasks, sessions, settings — gone.</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              ref={resetDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-dialog-title"
              aria-describedby="reset-dialog-desc"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass-static w-full max-w-sm p-6 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="reset-dialog-title" className="display-xl text-[28px] mb-2">Sure?</h3>
              <p id="reset-dialog-desc" className="text-sm text-muted mb-6">
                Every task, session, and streak will be permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={resetAllData}
                >
                  Delete all
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
