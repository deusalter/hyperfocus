'use client'

import { useEffect, useState, useRef } from 'react'

const GLYPHS = '!@#$%^&*<>/\\|{}[]?+=-_~'

/**
 * Scrambles characters in a string then resolves to the target over `duration` ms.
 * Each character reveals in left-to-right order. Respects prefers-reduced-motion.
 */
export function useScrambleText(target: string, duration = 480, deps: unknown[] = []) {
  const [output, setOutput] = useState(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!target) {
      setOutput('')
      return
    }

    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setOutput(target)
      return
    }

    const start = performance.now()
    const total = target.length

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const revealCount = Math.floor(progress * total)
      let next = ''
      for (let i = 0; i < total; i++) {
        const ch = target[i]
        if (i < revealCount || ch === ' ') {
          next += ch
        } else {
          next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
      }
      setOutput(next)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setOutput(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps])

  return output
}
