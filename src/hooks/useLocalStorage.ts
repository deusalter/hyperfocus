import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Persistent-state hook backed by AsyncStorage (was localStorage on web).
 * API is unchanged from the web version so callers don't have to adapt —
 * the only difference is the initial read is async, so `isHydrated` guards
 * the first render. Writes are fire-and-forget; state updates are optimistic.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)
  const latestValueRef = useRef(storedValue)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(key)
      .then((item) => {
        if (cancelled) return
        if (item != null) {
          try {
            const parsed = JSON.parse(item) as T
            setStoredValue(parsed)
            latestValueRef.current = parsed
          } catch (err) {
            console.warn(`AsyncStorage parse error for "${key}":`, err)
          }
        }
        setIsHydrated(true)
      })
      .catch((err) => {
        console.warn(`AsyncStorage read error for "${key}":`, err)
        setIsHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        latestValueRef.current = next
        AsyncStorage.setItem(key, JSON.stringify(next)).catch((err) => {
          console.warn(`AsyncStorage write error for "${key}":`, err)
        })
        return next
      })
    },
    [key]
  )

  return [isHydrated ? storedValue : initialValue, setValue]
}
