'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Volume2, VolumeX, Clock, Trash2, AlertTriangle } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Settings } from '@/lib/types'
import Button from '@/components/ui/Button'

const defaultSettings: Settings = {
  theme: 'dark',
  defaultFocusDuration: 25,
  soundEnabled: true,
}

export default function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<Settings>('hyperfocus-settings', defaultSettings)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    setSettings({ ...settings, theme: newTheme })
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleSound = () => {
    setSettings({ ...settings, soundEnabled: !settings.soundEnabled })
  }

  const setFocusDuration = (minutes: number) => {
    setSettings({ ...settings, defaultFocusDuration: minutes })
  }

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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Customize your experience</p>
      </motion.div>

      <div className="space-y-4 max-w-lg">
        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.theme === 'dark' ? 'bg-accent/10' : 'bg-warning/10'}`}>
                {settings.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-accent" />
                ) : (
                  <Sun className="w-5 h-5 text-warning" />
                )}
              </div>
              <div>
                <span className="text-sm font-medium block">Theme</span>
                <span className="text-xs text-muted capitalize">{settings.theme} mode</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="w-12 h-7 rounded-full relative transition-all duration-300"
              style={{
                background: settings.theme === 'dark'
                  ? 'linear-gradient(135deg, var(--color-accent-light), var(--color-accent-dark))'
                  : 'var(--color-border)',
                boxShadow: settings.theme === 'dark' ? '0 0 12px rgba(139, 92, 246, 0.3)' : 'none',
              }}
            >
              <motion.div
                className="w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm"
                animate={{ x: settings.theme === 'dark' ? 24 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Sound */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.soundEnabled ? 'bg-accent/10' : 'bg-surface'}`}>
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-accent" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted" />
                )}
              </div>
              <div>
                <span className="text-sm font-medium block">Sound Effects</span>
                <span className="text-xs text-muted">{settings.soundEnabled ? 'On' : 'Off'}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleSound}
              className="w-12 h-7 rounded-full relative transition-all duration-300"
              style={{
                background: settings.soundEnabled
                  ? 'linear-gradient(135deg, var(--color-accent-light), var(--color-accent-dark))'
                  : 'var(--color-border)',
                boxShadow: settings.soundEnabled ? '0 0 12px rgba(139, 92, 246, 0.3)' : 'none',
              }}
            >
              <motion.div
                className="w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm"
                animate={{ x: settings.soundEnabled ? 24 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Default Focus Duration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="text-sm font-medium block">Default Focus Duration</span>
              <span className="text-xs text-muted">{settings.defaultFocusDuration} minutes</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {[15, 25, 30, 45, 60].map((mins) => (
              <motion.button
                key={mins}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFocusDuration(mins)}
                className={`py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                  settings.defaultFocusDuration === mins
                    ? 'text-accent'
                    : 'bg-surface text-muted hover:text-foreground hover:bg-surface-hover border border-transparent'
                }`}
              >
                {settings.defaultFocusDuration === mins && (
                  <motion.div
                    layoutId="focusDuration"
                    className="absolute inset-0 bg-accent/20 border border-accent/30 rounded-lg shadow-sm shadow-accent/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{mins}m</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Reset Data */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium block">Reset All Data</span>
                <span className="text-xs text-muted block truncate sm:whitespace-normal">Clear all tasks, sessions, and settings</span>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="shrink-0"
            >
              Reset
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass w-full max-w-sm p-5 sm:p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
              <p className="text-sm text-muted mb-6">
                This will permanently delete all your tasks, focus sessions, streaks, and settings.
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
                  Delete Everything
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
