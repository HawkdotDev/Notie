import React, { useState, useEffect, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  Search,
  MoreHorizontal,
  ChevronDown,
  Check,
  FolderPlus,
  XCircle,
  Plus,
  ArrowRight,
  Trash2,
  Edit3
} from 'lucide-react'
import FileTree from '../FileTree'
import { getPathKey } from '../../utils/pathUtils'

interface SidebarProps {
  sidebarCollapsed: boolean
  sidebarWidth: number
  isResizing?: boolean
  workspacePath: string | null
  workspaceName?: string
  recentWorkspaces?: { path: string; name: string }[]
  activeFilePath: string | null
  openFiles?: { path: string; name: string }[]
  onFileSelect: (filePath: string) => void
  onCreateFileAtRoot: () => void
  onOpenWorkspace: () => void
  onCloseWorkspace: () => void
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

function Sidebar({
  sidebarCollapsed,
  sidebarWidth,
  isResizing = false,
  workspacePath,
  workspaceName,
  recentWorkspaces = [],
  activeFilePath,
  openFiles,
  onFileSelect,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  showSearchInput,
  onToggleSearchInput,
  searchQuery,
  onSearchChange,
  fileIcons,
  onMetadataLoaded,
  onStartResize
}: SidebarProps): React.JSX.Element {
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notie_workspace_dropdown') === 'true'
    } catch {
      return false
    }
  })
  const [showExplorerMenu, setShowExplorerMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notie_explorer_menu') === 'true'
    } catch {
      return false
    }
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const explorerMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('notie_workspace_dropdown', String(showWorkspaceDropdown))
    } catch {
      // ignore
    }
  }, [showWorkspaceDropdown])

  useEffect(() => {
    try {
      localStorage.setItem('notie_explorer_menu', String(showExplorerMenu))
    } catch {
      // ignore
    }
  }, [showExplorerMenu])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWorkspaceDropdown(false)
      }
      if (explorerMenuRef.current && !explorerMenuRef.current.contains(e.target as Node)) {
        setShowExplorerMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return (): void => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentDisplayName =
    workspaceName || (workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Select Workspace')

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
      <div className="sidebar-content flex flex-col h-full overflow-hidden shrink-0 w-60">
        {/* Top Action Row: Always visible */}
        <div className="sidebar-top-actions relative" ref={dropdownRef}>
          <button
            className={`sidebar-workspace-dropdown-btn ${showWorkspaceDropdown ? 'active' : ''}`}
            onClick={(): void => setShowWorkspaceDropdown((prev) => !prev)}
            title="Switch Workspace"
          >
            <Folder size={13} className="text-zinc-300 shrink-0" />
            <span className="workspace-name-label">{currentDisplayName}</span>
            <ChevronDown size={13} className="text-zinc-400 shrink-0" />
          </button>

          <button
            className={`sidebar-search-toggle-btn ${showSearchInput ? 'active' : ''}`}
            onClick={onToggleSearchInput}
            title="Search Files"
          >
            <Search size={14} />
          </button>

          {/* Workspace Dropdown Popover */}
          {showWorkspaceDropdown && (
            <div className="workspace-dropdown-popover">
              <div className="dropdown-section-title">WORKSPACES</div>

              <div className="dropdown-workspace-list">
                {recentWorkspaces.map((ws) => {
                  const isActive =
                    workspacePath && getPathKey(ws.path) === getPathKey(workspacePath)
                  return (
                    <div
                      key={ws.path}
                      className={`dropdown-workspace-item group ${isActive ? 'active' : ''}`}
                      onClick={(): void => {
                        if (onSwitchWorkspace) {
                          onSwitchWorkspace(ws.path, ws.name)
                        }
                        setShowWorkspaceDropdown(false)
                      }}
                    >
                      <Folder
                        size={13}
                        className={isActive ? 'text-purple-400 shrink-0' : 'text-zinc-400 shrink-0'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="workspace-item-name">{ws.name}</div>
                        <div className="workspace-item-path">{ws.path}</div>
                      </div>
                      {isActive && <Check size={13} className="text-purple-400 shrink-0 mr-1" />}
                      <button
                        className="trash-btn opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-all shrink-0"
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
                    </div>
                  )
                })}
              </div>

              <div className="dropdown-divider" />

              <button
                className="dropdown-action-item"
                onClick={(): void => {
                  onOpenWorkspace()
                  setShowWorkspaceDropdown(false)
                }}
              >
                <FolderPlus size={13} className="text-zinc-300 shrink-0" />
                <span>Open Workspace Folder...</span>
              </button>

              {workspacePath && (
                <button
                  className="dropdown-action-item danger"
                  onClick={(): void => {
                    onCloseWorkspace()
                    setShowWorkspaceDropdown(false)
                  }}
                >
                  <XCircle size={13} className="text-rose-400 shrink-0" />
                  <span>Close Workspace</span>
                </button>
              )}
            </div>
          )}
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

            {/* Section Header */}
            <div className="sidebar-section-header">
              <span>Explorer</span>
              <div className="flex items-center gap-1 relative" ref={explorerMenuRef}>
                <button
                  className="sidebar-dots-btn"
                  onClick={(): void => setShowExplorerMenu((prev) => !prev)}
                  title="Explorer Options"
                >
                  <MoreHorizontal size={14} />
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
                      <Plus size={12} />
                      <span>New File</span>
                    </button>
                    <button
                      className="context-menu-item"
                      onClick={(): void => {
                        window.dispatchEvent(new CustomEvent('create-root-folder'))
                        setShowExplorerMenu(false)
                      }}
                    >
                      <FolderPlus size={12} />
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
                      <Edit3 size={12} />
                      <span>Rename</span>
                    </button>
                    <button
                      className="context-menu-item danger"
                      onClick={(): void => {
                        onCloseWorkspace()
                        setShowExplorerMenu(false)
                      }}
                    >
                      <XCircle size={12} />
                      <span>Close Workspace</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto">
              <FileTree
                rootPath={workspacePath}
                activeFilePath={activeFilePath}
                openFiles={openFiles}
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
                    <Folder size={14} />
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
              <FolderOpen size={14} />
              <span>Open Folder...</span>
            </button>
          </div>
        ) : (
          /* Opening for First Time (No Recent Workspaces) */
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <div className="first-time-icon-wrapper mb-4">
              <FolderOpen size={32} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">No Workspace Open</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Open a local folder or workspace project to start exploring files and editing code.
            </p>
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 transition-all cursor-pointer border border-purple-500/50"
              onClick={onOpenWorkspace}
            >
              <FolderOpen size={14} />
              <span>Open Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div className="sidebar-resizer" onMouseDown={onStartResize} />
    </div>
  )
}

export default React.memo(Sidebar)
