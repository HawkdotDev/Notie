import React, { useState, useEffect, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  Search,
  MoreHorizontal,
  FolderPlus,
  Plus,
  ArrowRight,
  Trash2,
  Edit3,
  PanelLeftClose,
  Code2
} from 'lucide-react'
import FileTree from '../FileTree'

interface SidebarProps {
  sidebarCollapsed: boolean
  sidebarWidth: number
  isResizing?: boolean
  workspacePath: string | null
  workspaceName?: string
  recentWorkspaces?: { path: string; name: string }[]
  activeFilePath: string | null
  openFiles?: { path: string; name: string }[]
  unsavedFiles?: Record<string, boolean>
  onFileSelect: (filePath: string) => void
  onCreateFileAtRoot: () => void
  onOpenWorkspace: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onToggleSidebar?: () => void
  showSearchInput: boolean
  onToggleSearchInput: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onStartResize: (e: React.MouseEvent) => void
}

const getLanguage = (filePath: string | null): { name: string; color: string } => {
  if (!filePath) return { name: 'Markdown', color: 'text-zinc-400' }
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'py':
      return { name: 'Python', color: 'text-zinc-300' }
    case 'js':
    case 'jsx':
      return { name: 'JavaScript', color: 'text-yellow-400' }
    case 'ts':
    case 'tsx':
      return { name: 'TypeScript', color: 'text-blue-400' }
    case 'html':
      return { name: 'HTML', color: 'text-orange-400' }
    case 'css':
    case 'scss':
      return { name: 'CSS', color: 'text-sky-400' }
    case 'json':
      return { name: 'JSON', color: 'text-amber-400' }
    case 'md':
      return { name: 'Markdown', color: 'text-emerald-400' }
    default:
      return { name: 'Plain Text', color: 'text-zinc-400' }
  }
}

function Sidebar({
  sidebarCollapsed,
  sidebarWidth,
  isResizing = false,
  workspacePath,
  recentWorkspaces = [],
  activeFilePath,
  openFiles,
  unsavedFiles,
  onFileSelect,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onToggleSidebar,
  showSearchInput,
  onToggleSearchInput,
  searchQuery,
  onSearchChange,
  fileIcons,
  onMetadataLoaded,
  onStartResize
}: SidebarProps): React.JSX.Element {
  const [showExplorerMenu, setShowExplorerMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notie_explorer_menu') === 'true'
    } catch {
      return false
    }
  })
  const explorerMenuRef = useRef<HTMLDivElement>(null)

  const lang = getLanguage(activeFilePath)

  useEffect(() => {
    try {
      localStorage.setItem('notie_explorer_menu', String(showExplorerMenu))
    } catch {
      // ignore
    }
  }, [showExplorerMenu])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (explorerMenuRef.current && !explorerMenuRef.current.contains(e.target as Node)) {
        setShowExplorerMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return (): void => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasRecentWorkspaces = recentWorkspaces.length > 0

  return (
    <div
      className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={{
        width: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
        minWidth: sidebarCollapsed ? '0px' : '160px',
        maxWidth: sidebarCollapsed ? '0px' : '450px'
      }}
    >
      <div className="sidebar-content flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Top Action Row: Explorer Title + Action Buttons */}
        <div className="sidebar-top-actions">
          <div className="sidebar-header-title">
            <span>Explorer</span>
          </div>

          <div className="sidebar-header-buttons">
            {workspacePath && (
              <div className="relative" ref={explorerMenuRef}>
                <button
                  type="button"
                  className={`sidebar-action-btn ${showExplorerMenu ? 'active' : ''}`}
                  onClick={(): void => setShowExplorerMenu((prev) => !prev)}
                  title="More Options"
                >
                  <MoreHorizontal size={13} strokeWidth={1.5} />
                </button>

                {showExplorerMenu && (
                  <div className="explorer-options-popover">
                    <button
                      className="context-menu-item"
                      onClick={(): void => {
                        onCreateFileAtRoot()
                        setShowExplorerMenu(false)
                      }}
                    >
                      <Plus size={12} strokeWidth={1.5} />
                      <span>New File</span>
                    </button>
                    <button
                      className="context-menu-item"
                      onClick={(): void => {
                        window.dispatchEvent(new CustomEvent('create-root-folder'))
                        setShowExplorerMenu(false)
                      }}
                    >
                      <FolderPlus size={12} strokeWidth={1.5} fill="currentColor" />
                      <span>New Folder</span>
                    </button>
                    <div className="context-menu-divider" />
                    <button
                      className="context-menu-item"
                      onClick={(): void => {
                        window.dispatchEvent(new CustomEvent('rename-root-folder'))
                        setShowExplorerMenu(false)
                      }}
                    >
                      <Edit3 size={12} strokeWidth={1.5} />
                      <span>Rename</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className={`sidebar-action-btn ${showSearchInput ? 'active' : ''}`}
              onClick={onToggleSearchInput}
              title="Search Files"
            >
              <Search size={13} strokeWidth={1.5} />
            </button>

            {onToggleSidebar && (
              <button
                type="button"
                className="sidebar-action-btn"
                onClick={onToggleSidebar}
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Main Sidebar Body Area */}
        {workspacePath ? (
          <div className="flex flex-col flex-1 h-full min-h-0">
            {/* Collapsible/Expandable Search Input */}
            {(showSearchInput || searchQuery) && (
              <div className="sidebar-search-container">
                <Search size={13} className="sidebar-search-icon" />
                <input
                  className="sidebar-search-input"
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e): void => onSearchChange(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto">
              <FileTree
                rootPath={workspacePath}
                activeFilePath={activeFilePath}
                openFiles={openFiles}
                unsavedFiles={unsavedFiles}
                onFileSelect={onFileSelect}
                fileIcons={fileIcons}
                onMetadataLoaded={onMetadataLoaded}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        ) : hasRecentWorkspaces ? (
          /* No Folder Open, but Recent Workspaces Exist */
          <div className="recent-workspaces-panel">
            <div className="recent-workspaces-header">RECENT WORKSPACES</div>
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
              {recentWorkspaces.map((ws) => (
                <div
                  key={ws.path}
                  className="recent-workspace-card group"
                  onClick={(): void => {
                    if (onSwitchWorkspace) {
                      onSwitchWorkspace(ws.path, ws.name)
                    }
                  }}
                >
                  <div className="recent-workspace-card-icon">
                    <Folder size={14} fill="currentColor" />
                  </div>
                  <div className="recent-workspace-card-info">
                    <div className="recent-workspace-card-name">{ws.name}</div>
                    <div className="recent-workspace-card-path">{ws.path}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="trash-btn opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-all"
                      onClick={(e): void => {
                        e.stopPropagation()
                        if (onRemoveRecentWorkspace) {
                          onRemoveRecentWorkspace(ws.path)
                        }
                      }}
                      title="Remove from recent workspaces"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ArrowRight size={13} className="recent-workspace-card-arrow" />
                  </div>
                </div>
              ))}
            </div>
            <button className="sidebar-open-folder-btn" onClick={onOpenWorkspace}>
              <FolderOpen size={14} fill="currentColor" />
              <span>Open Folder...</span>
            </button>
          </div>
        ) : (
          /* Opening for First Time (No Recent Workspaces) */
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <div className="first-time-icon-wrapper mb-4">
              <FolderOpen size={32} fill="currentColor" className="text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">No Workspace Open</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Open a local folder or workspace project to start exploring files and editing code.
            </p>
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer border border-zinc-700"
              onClick={onOpenWorkspace}
            >
              <FolderOpen size={14} />
              <span>Open Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating File Type Pill in Sidebar Bottom Left Corner */}
      {workspacePath && activeFilePath && (
        <div
          className="sidebar-floating-filetype"
          title={`File Type: ${lang.name}`}
        >
          <div className="status-pill-item">
            <Code2 size={13} strokeWidth={1.5} className={`${lang.color} shrink-0`} />
            <span className="font-medium text-[#BFBFC7]">{lang.name}</span>
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div className="sidebar-resizer" onMouseDown={onStartResize} />
    </div>
  )
}

export default React.memo(Sidebar)
