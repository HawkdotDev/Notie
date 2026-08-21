import React, { useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import FileTree from '../../FileTree'
import PluginsWidget from '../PluginsWidget'
import SidebarSearch from './SidebarSearch'
import SidebarEmptyState from './SidebarEmptyState'

export type SidebarViewMode = 'explorer' | 'plugins'

interface SidebarBodyProps {
  activeView: SidebarViewMode
  workspacePath: string | null
  activeFilePath: string | null
  showSearchInput: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggleSearchInput?: () => void
  onCloseSearch?: () => void
  onCreateFileAtRoot?: () => void
  onFileSelect: (filePath: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  enabledPlugins: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenWorkspace: () => void
}

function SidebarBody({
  activeView,
  workspacePath,
  activeFilePath,
  showSearchInput,
  searchQuery,
  onSearchChange,
  onToggleSearchInput,
  onCloseSearch,
  onCreateFileAtRoot,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  enabledPlugins,
  onTogglePlugin,
  onOpenWorkspace
}: SidebarBodyProps): React.JSX.Element {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        if (onToggleSearchInput) {
          onToggleSearchInput()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleSearchInput])
  if (activeView === 'plugins') {
    return (
      <div className="flex-1 overflow-hidden h-full">
        <PluginsWidget
          enabledPlugins={enabledPlugins}
          onTogglePlugin={onTogglePlugin || ((): void => {})}
        />
      </div>
    )
  }

  if (workspacePath) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        {/* Top Notion Quick Navigation Links */}
        <div className="notion-sidebar-quick-links">
          <button
            type="button"
            className={`notion-quick-link-item ${showSearchInput ? 'active' : ''}`}
            onClick={onToggleSearchInput}
            title="Search notes"
          >
            <Search size={14} className="notion-quick-link-icon" />
            <span className="notion-quick-link-text">Search</span>
            <span className="notion-quick-link-shortcut">Ctrl+P</span>
          </button>
        </div>

        {/* Collapsible/Expandable Search Filter Input */}
        {(showSearchInput || searchQuery) && (
          <SidebarSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClose={onCloseSearch}
          />
        )}

        {/* Notion Section Header */}
        <div className="notion-sidebar-section-header group">
          <span className="notion-section-title">PAGES</span>
          {onCreateFileAtRoot && (
            <button
              type="button"
              className="notion-section-add-btn"
              onClick={onCreateFileAtRoot}
              title="Add page"
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Tree Navigation */}
        <div className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0">
          <FileTree
            rootPath={workspacePath}
            activeFilePath={activeFilePath}
            onFileSelect={onFileSelect}
            searchQuery={searchQuery}
            fileIcons={fileIcons}
            onMetadataLoaded={onMetadataLoaded}
          />
        </div>
      </div>
    )
  }

  return <SidebarEmptyState onOpenWorkspace={onOpenWorkspace} />
}

export default React.memo(SidebarBody)
