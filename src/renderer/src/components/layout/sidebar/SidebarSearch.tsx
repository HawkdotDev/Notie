import React from 'react'
import { Search } from 'lucide-react'

interface SidebarSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

function SidebarSearch({ searchQuery, onSearchChange }: SidebarSearchProps): React.JSX.Element {
  return (
    <div className="sidebar-search-container shrink-0">
      <Search size={13} className="sidebar-search-icon" />
      <input
        type="text"
        placeholder="Filter files (name, ext)..."
        value={searchQuery}
        onChange={(e): void => onSearchChange(e.target.value)}
        className="sidebar-search-input"
        autoFocus
      />
    </div>
  )
}

export default React.memo(SidebarSearch)
