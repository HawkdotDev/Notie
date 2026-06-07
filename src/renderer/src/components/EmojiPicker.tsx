import React, { useEffect, useRef } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  onRemove?: () => void
}

const popularEmojis = [
  '📝',
  '📄',
  '📁',
  '📂',
  '📓',
  '📕',
  '📗',
  '📘',
  '📙',
  '📔',
  '📖',
  '💡',
  '🚀',
  '🔥',
  '⭐',
  '🌟',
  '⚡',
  '🎯',
  '🏆',
  '🎨',
  '💻',
  '⚙️',
  '🔑',
  '🔒',
  '🔔',
  '📅',
  '📊',
  '📈',
  '📌',
  '📍',
  '✉️',
  '💬',
  '❤️',
  '👍',
  '🌱',
  '🍀',
  '🌸',
  '☀️',
  '🌙',
  '🌈',
  '☕',
  '✈️',
  '🏠',
  '💼',
  '🧭',
  '🛠️',
  '🧼',
  '🍔',
  '🐱',
  '🐶'
]

export default function EmojiPicker({
  onSelect,
  onClose,
  onRemove
}: EmojiPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div ref={containerRef} className="emoji-picker-popover">
      <div className="emoji-picker-header">
        <span>Select Icon</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRemove && (
            <button
              className="emoji-picker-remove-btn"
              onClick={(): void => {
                onRemove()
                onClose()
              }}
            >
              Remove
            </button>
          )}
          <button className="emoji-picker-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>
      <div className="emoji-picker-grid">
        {popularEmojis.map((emoji) => (
          <button
            key={emoji}
            className="emoji-picker-btn"
            onClick={(): void => {
              onSelect(emoji)
              onClose()
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
