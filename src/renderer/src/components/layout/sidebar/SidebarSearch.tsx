import React from 'react'
import { Search, X } from 'lucide-react'

interface SidebarSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onClose?: () => void
}

function SidebarSearch({
  searchQuery,
  onSearchChange,
  onClose
}: SidebarSearchProps): React.JSX.Element {
  return (
    <div className="sidebar-search-container shrink-0">
      <div className="sidebar-search-wrapper">
        <Search size={13} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Filter notes..."
          value={searchQuery}
          onChange={(e): void => onSearchChange(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Escape') {
              if (searchQuery) {
                onSearchChange('')
              } else if (onClose) {
                onClose()
              }
            }
          }}
          className="sidebar-search-input"
          autoFocus
        />
        {searchQuery ? (
          <button
            type="button"
            className="sidebar-search-clear-btn"
            onClick={(): void => onSearchChange('')}
            title="Clear filter (Esc)"
          >
            <X size={12} />
          </button>
        ) : (
          <span className="sidebar-search-badge">ESC</span>
        )}
      </div>
    </div>
  )
}

export default React.memo(SidebarSearch)
