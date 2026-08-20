import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Folder,
  ChevronDown,
  Check,
  FolderPlus,
  XCircle,
  Trash2,
  Edit3,
  Minus,
  Square,
  X,
  Bell,
  Settings,
  Share2,
  Download,
  Code2,
  FileText,
  Copy,
  Users
} from 'lucide-react'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'
import { getPathKey } from '../../utils/pathUtils'
import iconSvg from '../../assets/icon.svg'

interface TopHeaderProps {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  fileIcons?: Record<string, string>
  recentWorkspaces?: { path: string; name: string }[]
  onSwitchWorkspace?: (path: string, name?: string) => void
  onOpenWorkspace?: () => void
  onRenameWorkspace?: () => void
  onCloseWorkspace?: () => void
  onRemoveRecentWorkspace?: (path: string) => void
  onOpenSettings?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
}

function TopHeader({
  workspacePath,
  workspaceName,
  activeFilePath,
  fileIcons,
  recentWorkspaces = [],
  onSwitchWorkspace,
  onOpenWorkspace,
  onRenameWorkspace,
  onCloseWorkspace,
  onRemoveRecentWorkspace,
  onOpenSettings,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink
}: TopHeaderProps): React.JSX.Element {
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWorkspaceDropdown(false)
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowWorkspaceDropdown(false)
        setShowShareMenu(false)
      }
    }
    if (showWorkspaceDropdown || showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showWorkspaceDropdown, showShareMenu])

  const relativeParts = useMemo(() => {
    if (!activeFilePath) return []
    const rel = activeFilePath.replace(workspacePath || '', '').replace(/^[\\/]/, '')
    return rel ? rel.split(/[\\/]/) : []
  }, [activeFilePath, workspacePath])

  const customIcon = useMemo(() => {
    if (!activeFilePath || !fileIcons || !workspacePath) return undefined
    const rel = activeFilePath
      .toLowerCase()
      .replace(workspacePath.toLowerCase(), '')
      .replace(/^[\\/]/, '')
    return fileIcons[rel]
  }, [activeFilePath, fileIcons, workspacePath])

  const currentDisplayName =
    workspaceName || (workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Select Workspace')

  return (
    <div className="app-top-header" onDoubleClick={(): void => window.api.window.maximize()}>
      <div className="top-header-left">
        <div className="flex items-center gap-2 select-none shrink-0">
          <img src={iconSvg} className="w-4 h-4 object-contain" alt="Notie Logo" />
          <span className="app-title-logo">Notie</span>
        </div>

        {/* Vertical Pipe Separator */}
        {(activeFilePath || workspacePath) && <div className="header-pipe-separator" />}

        {/* Styled Minimal Breadcrumb Path Navigation */}
        {(activeFilePath || workspacePath) && (
          <div className="nav-breadcrumbs">
            {/* First Folder in Breadcrumbs (Workspace Root with Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className={`breadcrumb-item workspace-root ${showWorkspaceDropdown ? 'active' : ''}`}
                onClick={(): void => setShowWorkspaceDropdown((prev) => !prev)}
                title={`Workspace: ${currentDisplayName} (Click to change folder)`}
              >
                <Folder size={11} className="text-zinc-400 shrink-0" />
                <span className="max-w-35 truncate">{currentDisplayName}</span>
                <ChevronDown
                  size={9}
                  className={`text-zinc-500 shrink-0 transition-transform duration-150 ${showWorkspaceDropdown ? 'rotate-180 text-zinc-300' : ''}`}
                />
              </button>

              {/* Workspace Switcher Dropdown Popover */}
              {showWorkspaceDropdown && (
                <div className="workspace-dropdown-popover breadcrumb-dropdown-popover">
                  <div className="dropdown-section-title">WORKSPACES</div>

                  {recentWorkspaces.length > 0 ? (
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
                              fill="currentColor"
                              className={
                                isActive ? 'text-zinc-300 shrink-0' : 'text-zinc-400 shrink-0'
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="workspace-item-name">{ws.name}</div>
                              <div className="workspace-item-path">{ws.path}</div>
                            </div>
                            {isActive && (
                              <Check size={13} className="text-zinc-300 shrink-0 mr-1" />
                            )}
                            {onRemoveRecentWorkspace && (
                              <button
                                type="button"
                                className="trash-btn opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-all shrink-0"
                                onClick={(e): void => {
                                  e.stopPropagation()
                                  onRemoveRecentWorkspace(ws.path)
                                }}
                                title="Remove from recent workspaces"
                              >
                                <Trash2 size={12} />
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

                  <div className="dropdown-divider" />

                  {onOpenWorkspace && (
                    <button
                      type="button"
                      className="dropdown-action-item"
                      onClick={(): void => {
                        onOpenWorkspace()
                        setShowWorkspaceDropdown(false)
                      }}
                    >
                      <FolderPlus
                        size={13}
                        fill="currentColor"
                        className="text-zinc-300 shrink-0"
                      />
                      <span>Open Workspace Folder...</span>
                    </button>
                  )}

                  {workspacePath && (
                    <button
                      type="button"
                      className="dropdown-action-item"
                      onClick={(): void => {
                        if (onRenameWorkspace) {
                          onRenameWorkspace()
                        } else {
                          window.dispatchEvent(new CustomEvent('rename-root-folder'))
                        }
                        setShowWorkspaceDropdown(false)
                      }}
                    >
                      <Edit3 size={13} className="text-zinc-300 shrink-0" />
                      <span>Rename Workspace...</span>
                    </button>
                  )}

                  {workspacePath && onCloseWorkspace && (
                    <button
                      type="button"
                      className="dropdown-action-item danger"
                      onClick={(): void => {
                        onCloseWorkspace()
                        setShowWorkspaceDropdown(false)
                      }}
                    >
                      <XCircle size={13} fill="currentColor" className="text-rose-400 shrink-0" />
                      <span>Close Workspace</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {relativeParts.map((part, idx) => {
              const isLast = idx === relativeParts.length - 1
              return (
                <React.Fragment key={idx}>
                  <span className="breadcrumb-separator">/</span>
                  <div
                    className={`breadcrumb-item ${isLast ? 'active-file' : 'directory'}`}
                    title={part}
                  >
                    {isLast &&
                      (customIcon ? (
                        <span className="text-[11px] mr-0.5">{customIcon}</span>
                      ) : (
                        <ProfessionalFileIcon fileName={part} className="scale-75 opacity-90" />
                      ))}
                    <span className="truncate max-w-44">{part}</span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Header Action Icons & Window Controls */}
      <div className="top-header-right flex items-center gap-2">
        {/* Share & Export Dropdown */}
        <div className="relative no-drag" ref={shareMenuRef}>
          <button
            className={`btn-share ${showShareMenu ? 'active' : ''}`}
            onClick={(): void => setShowShareMenu((prev) => !prev)}
            title="Share & Export Document"
          >
            <Share2 size={12} strokeWidth={1.75} className="shrink-0" />
            <span>Share</span>
            <ChevronDown
              size={11}
              className={`transition-transform duration-150 ${showShareMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showShareMenu && (
            <div className="share-dropdown-menu">
              {/* Collaboration Section */}
              <div className="share-dropdown-section">
                <span className="share-section-title">Collaboration</span>
                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    if (onCopyLink) {
                      onCopyLink()
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                    }
                    setCopyFeedback(true)
                    setTimeout(() => setCopyFeedback(false), 1500)
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {copyFeedback ? (
                      <Check size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Copy size={13} className="text-zinc-400 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="share-item-title">
                        {copyFeedback ? 'Copied to Clipboard!' : 'Copy Reference Link'}
                      </span>
                      <span className="share-item-desc">Wikilink or internal document link</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    alert('Invite collaborators feature coming soon!')
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={13} className="text-zinc-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Invite Collaborators</span>
                      <span className="share-item-desc">Add team members to this workspace</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="share-dropdown-divider" />

              {/* Export Section */}
              <div className="share-dropdown-section">
                <span className="share-section-title">Export Document</span>
                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportHTML?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 size={13} className="text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as HTML</span>
                      <span className="share-item-desc">Formatted standalone HTML file</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportText?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={13} className="text-blue-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as Plain Text</span>
                      <span className="share-item-desc">Clean .txt file without formatting</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportMarkdown?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Download size={13} className="text-violet-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as Markdown</span>
                      <span className="share-item-desc">Raw .md document file</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          className="header-action-btn relative"
          onClick={(): void => alert('Notifications: All workspace systems operational.')}
          title="Notifications"
        >
          <Bell size={13} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-zinc-400" />
        </button>

        {/* Settings Icon Button */}
        <button
          className="header-action-btn"
          onClick={(): void => (onOpenSettings ? onOpenSettings() : alert('Settings Menu'))}
          title="Settings"
        >
          <Settings size={13} />
        </button>

        {/* User Profile Avatar */}
        <button
          className="header-user-avatar"
          onClick={(): void => alert('User Profile: Notie Account')}
          title="Profile (Notie User)"
        >
          <span>DN</span>
        </button>

        {/* Vertical Divider */}
        <div className="h-3 w-px bg-zinc-700/60 mx-0.5" />

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="window-controls">
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.minimize()}
            title="Minimize Window"
          >
            <Minus size={13} />
          </button>
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.maximize()}
            title="Maximize / Restore Window"
          >
            <Square size={11} />
          </button>
          <button
            className="window-control-btn close-btn"
            onClick={(): void => window.api.window.close()}
            title="Close Application"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TopHeader)
