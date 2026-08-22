import React, { useEffect } from 'react'
import { Search, Plus, Home } from 'lucide-react'
import FileTree from '../../FileTree'
import PluginsWidget from '../PluginsWidget'
import SidebarSearchView from './SidebarSearchView'
import SidebarEmptyState from './SidebarEmptyState'

export type SidebarViewMode = 'explorer' | 'search' | 'plugins'

interface SidebarBodyProps {
  activeView: SidebarViewMode
  workspacePath: string | null
  activeFilePath: string | null
  showSearchInput?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onToggleSearchInput?: () => void
  onCloseSearch?: () => void
  onCreateFileAtRoot?: () => void
  onFileSelect: (filePath: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  enabledPlugins: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenWorkspace: () => void
  onOpenSettings?: () => void
  onSwitchView?: (view: SidebarViewMode) => void
}

function SidebarBody({
  activeView,
  workspacePath,
  activeFilePath,
  onCreateFileAtRoot,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  enabledPlugins,
  onTogglePlugin,
  onOpenWorkspace,
  onOpenSettings,
  onSwitchView
}: SidebarBodyProps): React.JSX.Element {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        if (onSwitchView) {
          onSwitchView(activeView === 'search' ? 'explorer' : 'search')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [onSwitchView, activeView])

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
      <div
        className="flex flex-col flex-1 h-full min-h-0 overflow-hidden"
        onContextMenu={(e): void => {
          if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).classList.contains('notion-sidebar-quick-links') ||
            (e.target as HTMLElement).classList.contains('notion-sidebar-section-header')
          ) {
            e.preventDefault()
            window.dispatchEvent(
              new CustomEvent('sidebar-context-menu', {
                detail: { x: e.clientX, y: e.clientY }
              })
            )
          }
        }}
      >
        {/* Top Notion Quick Navigation Links (Home & Search) */}
        <div className="notion-sidebar-quick-links">
          <button
            type="button"
            className={`notion-quick-link-item ${activeView === 'explorer' ? 'active' : ''}`}
            onClick={(): void => onSwitchView?.('explorer')}
            title="Home view (Files)"
          >
            <Home size={14} className="notion-quick-link-icon" />
            <span className="notion-quick-link-text">Home</span>
          </button>
          <button
            type="button"
            className={`notion-quick-link-item ${activeView === 'search' ? 'active' : ''}`}
            onClick={(): void => onSwitchView?.(activeView === 'search' ? 'explorer' : 'search')}
            title="Search workspace (Ctrl+P)"
          >
            <Search size={14} className="notion-quick-link-icon" />
            <span className="notion-quick-link-text">Search</span>
            <span className="notion-quick-link-shortcut">Ctrl+P</span>
          </button>
        </div>

        {/* View Switching: Search View vs Home / File Tree View */}
        {activeView === 'search' ? (
          <SidebarSearchView
            workspacePath={workspacePath}
            activeFilePath={activeFilePath}
            onFileSelect={onFileSelect}
            fileIcons={fileIcons}
            onBackToExplorer={(): void => onSwitchView?.('explorer')}
          />
        ) : (
          <>
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
            <div
              className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0"
              onContextMenu={(e): void => {
                if (e.target === e.currentTarget) {
                  e.preventDefault()
                  window.dispatchEvent(
                    new CustomEvent('sidebar-context-menu', {
                      detail: { x: e.clientX, y: e.clientY }
                    })
                  )
                }
              }}
            >
              <FileTree
                rootPath={workspacePath}
                activeFilePath={activeFilePath}
                onFileSelect={onFileSelect}
                fileIcons={fileIcons}
                onMetadataLoaded={onMetadataLoaded}
                onOpenSettings={onOpenSettings}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  return <SidebarEmptyState onOpenWorkspace={onOpenWorkspace} />
}

export default React.memo(SidebarBody)
