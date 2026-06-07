import React, { useEffect, useRef } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
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

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps): React.JSX.Element {
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
        <button className="emoji-picker-close-btn" onClick={onClose}>
          &times;
        </button>
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
