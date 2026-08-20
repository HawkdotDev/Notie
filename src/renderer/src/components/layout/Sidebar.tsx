import React, { useState, useEffect, useRef } from 'react'
import {
  Folder,
  ChevronDown,
  Check,
  FolderPlus,
  Plus,
  Trash2,
  Edit3,
  SidebarClose,
  Search,
  XCircle,
  Smile
} from 'lucide-react'
import FileTree from '../FileTree'
import PluginsWidget from './PluginsWidget'
import EmojiPicker from '../EmojiPicker'
import { getPathKey } from '../../utils/pathUtils'
import { WorkspaceIcon } from '../../utils/fileIconUtils'

export type SidebarViewMode = 'explorer' | 'plugins'

interface SidebarProps {
  activeView?: SidebarViewMode
  sidebarCollapsed: boolean
  sidebarWidth: number
  isResizing?: boolean
  workspacePath: string | null
  workspaceName?: string
  workspaceIcons?: Record<string, string>
  onSetWorkspaceIcon?: (workspacePath: string, icon: string | null) => void
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
  onRenameWorkspace?: () => void
  onToggleSidebar?: () => void
  showSearchInput: boolean
  onToggleSearchInput: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onStartResize: (e: React.MouseEvent) => void
  enabledPlugins?: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenSettings?: () => void
}

function Sidebar({
  activeView = 'explorer',
  sidebarCollapsed,
  sidebarWidth,
  isResizing = false,
  workspacePath,
  workspaceName,
  workspaceIcons = {},
  onSetWorkspaceIcon,
  recentWorkspaces = [],
  activeFilePath,
  onFileSelect,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onRenameWorkspace,
  onToggleSidebar,
  showSearchInput,
  searchQuery,
  onSearchChange,
  fileIcons,
  onMetadataLoaded,
  onStartResize,
  enabledPlugins = {},
  onTogglePlugin
}: SidebarProps): React.JSX.Element {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<boolean>(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)

  const currentDisplayName =
    workspaceName ||
    (workspacePath ? workspacePath.split(/[\\/]/).filter(Boolean).pop() : '') ||
    'Select Workspace'

  const currentIcon = workspacePath
    ? workspaceIcons[getPathKey(workspacePath)] || workspaceIcons[workspacePath]
    : undefined

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false)
        setShowEmojiPicker(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowWorkspaceMenu(false)
        setShowEmojiPicker(false)
      }
    }
    if (showWorkspaceMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showWorkspaceMenu, showEmojiPicker])

  return (
    <div
      className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={{
        width: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
        minWidth: sidebarCollapsed ? '0px' : '240px',
        maxWidth: sidebarCollapsed ? '0px' : '450px'
      }}
    >
      <div className="sidebar-content flex flex-col h-full w-full min-w-0 relative">
        {/* Top Action Row: Workspace Dropdown / Extensions Title + Collapse Button + Divider */}
        <div className="sidebar-top-actions">
          {activeView === 'plugins' ? (
            <div className="sidebar-header-title">
              <span>Extensions</span>
            </div>
          ) : (
            <div className="relative flex-1 min-w-0 mr-1" ref={workspaceMenuRef}>
              <button
                type="button"
                className={`sidebar-workspace-trigger ${showWorkspaceMenu ? 'active' : ''}`}
                onClick={(): void => setShowWorkspaceMenu((prev) => !prev)}
                title={`Workspace: ${currentDisplayName} (Click to switch or manage)`}
              >
                <WorkspaceIcon name={currentDisplayName} icon={currentIcon} size={20} />
                <span className="sidebar-workspace-name truncate">{currentDisplayName}</span>
                <ChevronDown
                  size={12}
                  className={`sidebar-workspace-chevron shrink-0 transition-transform duration-150 ${
                    showWorkspaceMenu ? 'rotate-180 text-zinc-200' : 'text-zinc-500'
                  }`}
                />
              </button>

              {/* Workspace Switcher Popover */}
              {showWorkspaceMenu && (
                <div className="notion-dropdown-popover sidebar-workspace-popover">
                  <div className="dropdown-section-title">WORKSPACES</div>

                  {recentWorkspaces.length > 0 ? (
                    <div className="dropdown-workspace-list">
                      {recentWorkspaces.map((ws) => {
                        const isActive =
                          workspacePath && getPathKey(ws.path) === getPathKey(workspacePath)
                        const wsIcon =
                          workspaceIcons[getPathKey(ws.path)] || workspaceIcons[ws.path]
                        return (
                          <div
                            key={ws.path}
                            className={`notion-workspace-row ${isActive ? 'active' : ''}`}
                            onClick={(): void => {
                              if (onSwitchWorkspace) {
                                onSwitchWorkspace(ws.path, ws.name)
                              }
                              setShowWorkspaceMenu(false)
                            }}
                          >
                            <WorkspaceIcon name={ws.name} icon={wsIcon} size={18} />
                            <div className="flex-1 min-w-0">
                              <div className="notion-row-name truncate text-xs">{ws.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{ws.path}</div>
                            </div>
                            {isActive && (
                              <Check size={14} className="text-zinc-200 shrink-0 ml-auto" />
                            )}
                            {onRemoveRecentWorkspace && (
                              <button
                                type="button"
                                className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                onClick={(e): void => {
                                  e.stopPropagation()
                                  onRemoveRecentWorkspace(ws.path)
                                }}
                                title="Remove from recent"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-2 py-1.5 text-[11px] text-zinc-500 italic">
                      No recent workspaces
                    </div>
                  )}

                  <div className="notion-menu-divider" />

                  {/* Actions List */}
                  <div className="notion-popover-section">
                    {workspacePath && onSetWorkspaceIcon && (
                      <button
                        type="button"
                        className="notion-menu-item"
                        onClick={(): void => setShowEmojiPicker(true)}
                      >
                        <Smile size={14} className="text-zinc-300 shrink-0" />
                        <span>
                          {currentIcon ? 'Change Workspace Icon...' : 'Add Workspace Icon...'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="notion-menu-item"
                      onClick={(): void => {
                        onCreateFileAtRoot()
                        setShowWorkspaceMenu(false)
                      }}
                    >
                      <Plus size={14} className="text-zinc-300 shrink-0" />
                      <span>New File</span>
                    </button>

                    <button
                      type="button"
                      className="notion-menu-item"
                      onClick={(): void => {
                        window.dispatchEvent(new CustomEvent('create-root-folder'))
                        setShowWorkspaceMenu(false)
                      }}
                    >
                      <FolderPlus size={14} className="text-zinc-300 shrink-0" />
                      <span>New Folder</span>
                    </button>

                    <button
                      type="button"
                      className="notion-menu-item"
                      onClick={(): void => {
                        onOpenWorkspace()
                        setShowWorkspaceMenu(false)
                      }}
                    >
                      <Folder size={14} className="text-zinc-300 shrink-0" />
                      <span className="text-zinc-200 font-medium">Open Workspace Folder...</span>
                    </button>

                    {workspacePath && (
                      <button
                        type="button"
                        className="notion-menu-item"
                        onClick={(): void => {
                          if (onRenameWorkspace) {
                            onRenameWorkspace()
                          } else {
                            window.dispatchEvent(new CustomEvent('rename-root-folder'))
                          }
                          setShowWorkspaceMenu(false)
                        }}
                      >
                        <Edit3 size={14} className="text-zinc-300 shrink-0" />
                        <span>Rename Workspace...</span>
                      </button>
                    )}

                    {workspacePath && onCloseWorkspace && (
                      <button
                        type="button"
                        className="notion-menu-item text-rose-400 hover:text-rose-300"
                        onClick={(): void => {
                          onCloseWorkspace()
                          setShowWorkspaceMenu(false)
                        }}
                      >
                        <XCircle size={14} className="text-rose-400 shrink-0" />
                        <span>Close Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Emoji Picker Popover for Workspace Icon */}
              {showEmojiPicker && workspacePath && onSetWorkspaceIcon && (
                <div className="absolute top-10 left-0 z-1100">
                  <EmojiPicker
                    onSelect={(emoji): void => {
                      onSetWorkspaceIcon(workspacePath, emoji)
                      setShowEmojiPicker(false)
                      setShowWorkspaceMenu(false)
                    }}
                    onClose={(): void => setShowEmojiPicker(false)}
                    onRemove={
                      currentIcon
                        ? (): void => {
                            onSetWorkspaceIcon(workspacePath, null)
                            setShowEmojiPicker(false)
                            setShowWorkspaceMenu(false)
                          }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Right Action Button: Sidebar Toggle */}
          <div className="sidebar-header-buttons">
            {onToggleSidebar && (
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                title="Collapse Sidebar"
              >
                <SidebarClose size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>

          <div className="sidebar-header-divider" />
        </div>

        {/* Main Sidebar Body Area */}
        {activeView === 'plugins' ? (
          <div className="flex-1 overflow-hidden h-full">
            <PluginsWidget
              enabledPlugins={enabledPlugins}
              onTogglePlugin={onTogglePlugin || ((): void => {})}
            />
          </div>
        ) : workspacePath ? (
          <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
            {/* Collapsible/Expandable Search Input */}
            {(showSearchInput || searchQuery) && (
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
            )}

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
        ) : (
          <div className="sidebar-empty flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="sidebar-empty-icon mb-3">
              <Folder size={28} className="text-zinc-600" />
            </div>
            <p className="sidebar-empty-text text-xs text-zinc-400 mb-4">
              No workspace folder open
            </p>
            <button
              type="button"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              onClick={onOpenWorkspace}
            >
              <FolderPlus size={13} />
              <span>Open Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Resize handle bar */}
      <div
        className={`sidebar-resizer ${isResizing ? 'is-active' : ''}`}
        onMouseDown={onStartResize}
      />
    </div>
  )
}

export default React.memo(Sidebar)
