'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          router.push('/tasks')
          // Focus the task input after navigation
          setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder*="Add a task"]')
            input?.focus()
          }, 300)
          break
        case 't':
          e.preventDefault()
          router.push('/focus')
          break
        case 'd':
          e.preventDefault()
          router.push('/')
          break
        case 's':
          e.preventDefault()
          router.push('/stats')
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
