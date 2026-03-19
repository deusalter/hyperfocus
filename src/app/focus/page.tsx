'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, ChevronDown } from 'lucide-react'
import { useTimer } from '@/hooks/useTimer'
import { useTasks } from '@/hooks/useTasks'
import TimerDisplay from '@/components/focus/TimerDisplay'
import TimerControls from '@/components/focus/TimerControls'
import TimerPresets from '@/components/focus/TimerPresets'
import SessionComplete from '@/components/focus/SessionComplete'
import SessionHistory from '@/components/focus/SessionHistory'
import AmbientMode from '@/components/focus/AmbientMode'

export default function FocusPage() {
  const [showAmbient, setShowAmbient] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string>('')
  const {
    isRunning,
    isPaused,
    duration,
    remaining,
    elapsed,
    progress,
    isComplete,
    isBreak,
    sessions,
    start,
    pause,
    resume,
    reset,
    stop,
    startBreak,
    setDuration,
  } = useTimer()
  const { todayTasks } = useTasks()

  const incompleteTasks = todayTasks.filter((t) => !t.completed)

  const handleStart = () => {
    const task = incompleteTasks.find((t) => t.id === selectedTask)
    start(duration, task?.id, task?.title)
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Focus</h1>
          <p className="text-sm text-muted mt-0.5">Deep work starts here</p>
        </div>
        {(isRunning || isPaused) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAmbient(true)}
            className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-surface transition-colors"
            title="Enter ambient mode"
          >
            <Maximize2 className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <SessionComplete
            key="complete"
            isBreak={isBreak}
            onStartBreak={startBreak}
            onReset={reset}
            onNewSession={handleStart}
          />
        ) : (
          <motion.div key="timer">
            <TimerPresets
              currentDuration={duration}
              onSelect={setDuration}
              disabled={isRunning || isPaused}
            />

            <TimerDisplay
              remaining={remaining}
              progress={progress}
              isRunning={isRunning}
              isBreak={isBreak}
            />

            {!isRunning && !isPaused && incompleteTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">
                  Working on
                </label>
                <div className="relative">
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full glass glass-input px-4 py-3 pr-10 text-sm bg-transparent text-foreground outline-none cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-background">Just focusing</option>
                    {incompleteTasks.map((task) => (
                      <option key={task.id} value={task.id} className="bg-background">
                        {task.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </motion.div>
            )}

            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              elapsed={elapsed}
              onStart={handleStart}
              onPause={pause}
              onResume={resume}
              onReset={reset}
              onStop={stop}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SessionHistory sessions={sessions} />

      <AnimatePresence>
        {showAmbient && (isRunning || isPaused) && (
          <AmbientMode
            remaining={remaining}
            progress={progress}
            isBreak={isBreak}
            onExit={() => setShowAmbient(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
