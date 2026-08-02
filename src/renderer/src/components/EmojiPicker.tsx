import React, { useEffect, useRef, useState } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  onRemove?: () => void
}

const emojiCategories = [
  {
    category: 'Popular',
    emojis: ['📝', '🚀', '💡', '🔥', '⭐', '⚡', '🎯', '🎨', '💻', '⚙️', '📌', '📅']
  },
  {
    category: 'Objects & Tech',
    emojis: [
      '📄',
      '📁',
      '📂',
      '📓',
      '📕',
      '📗',
      '📘',
      '📙',
      '🔑',
      '🔒',
      '🔔',
      '📊',
      '📈',
      '✉️',
      '💬',
      '🛠️',
      '🧭'
    ]
  },
  {
    category: 'Nature & Food',
    emojis: ['🌱', '🍀', '🌸', '☀️', '🌙', '🌈', '☕', '🍔', '🐱', '🐶', '🏆', '✈️', '🏠', '💼']
  }
]

export default function EmojiPicker({
  onSelect,
  onClose,
  onRemove
}: EmojiPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleRandom = (): void => {
    const all = emojiCategories.flatMap((c) => c.emojis)
    const random = all[Math.floor(Math.random() * all.length)]
    onSelect(random)
    onClose()
  }

  return (
    <div ref={containerRef} className="emoji-picker-popover">
      <div className="emoji-picker-header">
        <input
          type="text"
          className="emoji-picker-search"
          placeholder="Search icon..."
          value={searchQuery}
          onChange={(e): void => setSearchQuery(e.target.value)}
          autoFocus
        />
        <div className="emoji-picker-actions">
          <button className="emoji-picker-action-btn" onClick={handleRandom}>
            Random
          </button>
          {onRemove && (
            <button
              className="emoji-picker-action-btn remove"
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

      <div className="emoji-picker-scroll-area">
        {emojiCategories.map((cat) => {
          const filtered = searchQuery
            ? cat.emojis.filter((e) => e.includes(searchQuery))
            : cat.emojis

          if (filtered.length === 0) return null

          return (
            <div key={cat.category} className="emoji-category-block mb-2">
              <div className="emoji-category-title">{cat.category}</div>
              <div className="emoji-picker-grid">
                {filtered.map((emoji) => (
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
        })}
      </div>
    </div>
  )
}
