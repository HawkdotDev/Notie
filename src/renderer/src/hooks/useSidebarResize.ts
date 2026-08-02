import { useState, useRef, useCallback } from 'react'

export interface SidebarResizeState {
  sidebarWidth: number
  rightSidebarWidth: number
  isResizingLeft: boolean
  isResizingRight: boolean
  startLeftResize: (e: React.MouseEvent) => void
  startRightResize: (e: React.MouseEvent) => void
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>
  setRightSidebarWidth: React.Dispatch<React.SetStateAction<number>>
}

export function useSidebarResize(
  initialLeftWidth = 240,
  initialRightWidth = 220
): SidebarResizeState {
  const [sidebarWidth, setSidebarWidth] = useState<number>(initialLeftWidth)
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(initialRightWidth)

  const isResizingLeftRef = useRef<boolean>(false)
  const isResizingRightRef = useRef<boolean>(false)

  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false)
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false)

  const startLeftResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingLeftRef.current = true
    setIsResizingLeft(true)

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingLeftRef.current) return
      const newWidth = Math.max(160, Math.min(450, moveEvent.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = (): void => {
      isResizingLeftRef.current = false
      setIsResizingLeft(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const startRightResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingRightRef.current = true
    setIsResizingRight(true)

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingRightRef.current) return
      const newWidth = Math.max(160, Math.min(400, window.innerWidth - moveEvent.clientX))
      setRightSidebarWidth(newWidth)
    }

    const handleMouseUp = (): void => {
      isResizingRightRef.current = false
      setIsResizingRight(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  return {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize,
    setSidebarWidth,
    setRightSidebarWidth
  }
}
