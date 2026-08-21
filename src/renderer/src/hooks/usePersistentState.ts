import { useState, useRef, useCallback, useEffect } from 'react'
import { PersistentAppState } from '../types'

const PERSISTENT_APP_STATE_KEY = 'mink_app_state_v1'

export function usePersistentState(): {
  savedState: Partial<PersistentAppState>
  saveState: (state: PersistentAppState) => void
} {
  const [savedState] = useState<Partial<PersistentAppState>>(() => {
    try {
      const saved = localStorage.getItem(PERSISTENT_APP_STATE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {}
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveState = useCallback((state: PersistentAppState): void => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(PERSISTENT_APP_STATE_KEY, JSON.stringify(state))
      } catch (e) {
        console.warn('Failed to persist app state:', e)
      }
    }, 300)
  }, [])

  useEffect(() => {
    return (): void => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  return { savedState, saveState }
}
