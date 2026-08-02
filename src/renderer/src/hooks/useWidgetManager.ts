import { useState, useCallback } from 'react'
import { WidgetState, WidgetLayout } from '../types'

export interface WidgetManagerHook {
  widgetState: WidgetState
  widgetZIndexes: Record<string, number>
  widgetPositions: Record<string, WidgetLayout>
  bringWidgetToFront: (id: string) => void
  handleToggleWidget: (id: keyof WidgetState) => void
  handleWidgetLayoutChange: (
    id: string,
    pos: { x: number; y: number },
    size: { width: number; height: number }
  ) => void
  setWidgetState: React.Dispatch<React.SetStateAction<WidgetState>>
}

export function useWidgetManager(
  initialWidgetState?: Partial<WidgetState>,
  initialZIndexes?: Record<string, number>,
  initialPositions?: Record<string, WidgetLayout>
): WidgetManagerHook {
  const [widgetState, setWidgetState] = useState<WidgetState>({
    assistant: true,
    stats: false,
    terminal: false,
    snippets: false,
    ...initialWidgetState
  })

  const [widgetZIndexes, setWidgetZIndexes] = useState<Record<string, number>>({
    assistant: 100,
    stats: 101,
    terminal: 102,
    snippets: 103,
    ...initialZIndexes
  })

  const [widgetPositions, setWidgetPositions] = useState<Record<string, WidgetLayout>>({
    assistant: {
      x: Math.max(260, typeof window !== 'undefined' ? window.innerWidth - 380 : 800),
      y: 85,
      width: 330,
      height: 420
    },
    stats: { x: 260, y: 85, width: 290, height: 340 },
    terminal: {
      x: Math.max(260, typeof window !== 'undefined' ? window.innerWidth - 480 : 800),
      y: Math.max(100, typeof window !== 'undefined' ? window.innerHeight - 270 : 500),
      width: 440,
      height: 220
    },
    snippets: { x: 320, y: 140, width: 300, height: 340 },
    ...initialPositions
  })

  const bringWidgetToFront = useCallback((id: string) => {
    setWidgetZIndexes((prev) => {
      const currentMax = Math.max(...Object.values(prev), 100)
      return { ...prev, [id]: currentMax + 1 }
    })
  }, [])

  const handleToggleWidget = useCallback(
    (id: keyof WidgetState) => {
      setWidgetState((prev) => {
        const nextVal = !prev[id]
        if (nextVal) {
          bringWidgetToFront(id)
        }
        return { ...prev, [id]: nextVal }
      })
    },
    [bringWidgetToFront]
  )

  const handleWidgetLayoutChange = useCallback(
    (id: string, pos: { x: number; y: number }, size: { width: number; height: number }): void => {
      setWidgetPositions((prev) => ({
        ...prev,
        [id]: { x: pos.x, y: pos.y, width: size.width, height: size.height }
      }))
    },
    []
  )

  return {
    widgetState,
    widgetZIndexes,
    widgetPositions,
    bringWidgetToFront,
    handleToggleWidget,
    handleWidgetLayoutChange,
    setWidgetState
  }
}
