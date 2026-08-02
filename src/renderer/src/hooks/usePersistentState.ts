import { useState } from 'react'
import { PersistentAppState } from '../types'

const PERSISTENT_APP_STATE_KEY = 'notie_app_state_v1'

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

  const saveState = (state: PersistentAppState): void => {
    try {
      localStorage.setItem(PERSISTENT_APP_STATE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to persist app state:', e)
    }
  }

  return { savedState, saveState }
}
