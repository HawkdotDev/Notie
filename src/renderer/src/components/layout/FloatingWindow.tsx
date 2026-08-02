import React, { useState, useRef } from 'react'
import { X, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react'

export interface FloatingWindowProps {
  id: string
  title: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  initialPos?: { x: number; y: number }
  initialSize?: { width: number; height: number }
  minWidth?: number
  minHeight?: number
  zIndex: number
  onFocus: () => void
  onClose: () => void
  onLayoutChange?: (pos: { x: number; y: number }, size: { width: number; height: number }) => void
  children: React.ReactNode
  className?: string
}

export default function FloatingWindow({
  title,
  icon,
  badge,
  initialPos = { x: 100, y: 100 },
  initialSize = { width: 330, height: 380 },
  minWidth = 240,
  minHeight = 140,
  zIndex,
  onFocus,
  onClose,
  onLayoutChange,
  children,
  className = ''
}: FloatingWindowProps): React.JSX.Element {
  const [pos, setPos] = useState<{ x: number; y: number }>(initialPos)
  const [size, setSize] = useState<{ width: number; height: number }>(initialSize)
  const [isMinimized, setIsMinimized] = useState<boolean>(false)

  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)

  // Auto-clamp window position & dimensions when viewport resizes
  React.useEffect(() => {
    const handleWindowResize = (): void => {
      setSize((prevSize) => {
        const maxW = Math.max(minWidth, window.innerWidth - 20)
        const maxH = Math.max(minHeight, window.innerHeight - 107)
        return {
          width: Math.min(prevSize.width, maxW),
          height: Math.min(prevSize.height, maxH)
        }
      })

      setPos((prevPos) => {
        const currentWidth = Math.min(size.width, window.innerWidth - 20)
        const currentHeight = isMinimized ? 40 : Math.min(size.height, window.innerHeight - 107)
        const minX = 10
        const maxX = Math.max(minX, window.innerWidth - currentWidth - 10)
        const minY = 75
        const maxY = Math.max(minY, window.innerHeight - currentHeight - 32)

        return {
          x: Math.max(minX, Math.min(maxX, prevPos.x)),
          y: Math.max(minY, Math.min(maxY, prevPos.y))
        }
      })
    }

    window.addEventListener('resize', handleWindowResize)
    return (): void => window.removeEventListener('resize', handleWindowResize)
  }, [size.width, size.height, isMinimized, minWidth, minHeight])

  // Dragging logic with strict viewport bounds clamping
  const handleHeaderMouseDown = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('.window-action-btn')) return
    e.preventDefault()
    onFocus()

    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    isDraggingRef.current = true

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isDraggingRef.current) return
      const currentWidth = size.width
      const currentHeight = isMinimized ? 40 : size.height
      const minX = 10
      const maxX = Math.max(minX, window.innerWidth - currentWidth - 10)
      const minY = 75 // Below top header & subheader
      const maxY = Math.max(minY, window.innerHeight - currentHeight - 32) // Above status bar

      const newX = Math.max(minX, Math.min(maxX, moveEvent.clientX - startX))
      const newY = Math.max(minY, Math.min(maxY, moveEvent.clientY - startY))
      setPos({ x: newX, y: newY })
    }

    const handleMouseUp = (): void => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (onLayoutChange) {
        onLayoutChange(pos, size)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Resizing logic with viewport bounds clamping
  const handleResizeMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    onFocus()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height
    isResizingRef.current = true

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingRef.current) return
      const maxWidth = Math.max(minWidth, window.innerWidth - pos.x - 10)
      const maxHeight = Math.max(minHeight, window.innerHeight - pos.y - 32)

      const calculatedWidth = startWidth + (moveEvent.clientX - startX)
      const calculatedHeight = startHeight + (moveEvent.clientY - startY)

      const newWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth))
      const newHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = (): void => {
      isResizingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (onLayoutChange) {
        onLayoutChange(pos, size)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`floating-widget-window ${isMinimized ? 'minimized' : ''} ${className}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex: zIndex
      }}
      onMouseDown={onFocus}
    >
      {/* Header Bar (Drag Handle) */}
      <div className="floating-widget-header" onMouseDown={handleHeaderMouseDown}>
        <div className="flex items-center gap-2 min-w-0 select-none">
          <GripHorizontal
            size={13}
            className="text-zinc-500 cursor-grab shrink-0 hover:text-zinc-300"
          />
          {icon && <span className="flex items-center shrink-0">{icon}</span>}
          <span className="font-semibold text-xs text-zinc-200 truncate">{title}</span>
          {badge}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            className="window-action-btn"
            onClick={(): void => setIsMinimized((prev) => !prev)}
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>

          <button className="window-action-btn close-btn" onClick={onClose} title="Close Window">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && <div className="floating-widget-body">{children}</div>}

      {/* Bottom Right Resize Handle */}
      {!isMinimized && (
        <div
          className="floating-widget-resize-handle"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
      )}
    </div>
  )
}
