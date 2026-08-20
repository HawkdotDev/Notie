import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Minus, Square, X, Bell, Settings } from 'lucide-react'
import iconSvg from '../../assets/icon.svg'

interface TopHeaderProps {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  fileIcons?: Record<string, string>
  onOpenWorkspace?: () => void
  onOpenSettings?: () => void
}

function TopHeader({
  workspacePath,
  workspaceName,
  activeFilePath,
  onOpenWorkspace,
  onOpenSettings
}: TopHeaderProps): React.JSX.Element {
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowAccountMenu(false)
      }
    }
    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAccountMenu])

  const relativeParts = useMemo(() => {
    if (!activeFilePath) return []
    const rel = activeFilePath.replace(workspacePath || '', '').replace(/^[\\/]/, '')
    return rel ? rel.split(/[\\/]/) : []
  }, [activeFilePath, workspacePath])

  const currentDisplayName =
    workspaceName ||
    (workspacePath ? workspacePath.split(/[\\/]/).filter(Boolean).pop() : '') ||
    'Select Workspace'

  return (
    <div
      className="app-top-header select-none"
      onDoubleClick={(): void => window.api?.window?.maximize?.()}
    >
      {/* Left Application Brand Logo & Navigation Breadcrumbs */}
      <div className="top-header-left flex items-center gap-2">
        {/* Brand App Monogram Badge */}
        <div
          className="header-brand-logo flex items-center gap-2 cursor-pointer"
          onClick={onOpenWorkspace}
          title="Notie Workspace - Click to open folder"
        >
          <img src={iconSvg} alt="Notie Logo" className="w-4 h-4 object-contain" />
          <span className="font-semibold text-xs text-zinc-300 tracking-tight">Notie</span>
        </div>

        {/* Vertical Pipe Separator */}
        {(activeFilePath || workspacePath) && <div className="header-pipe-separator" />}

        {/* Styled Minimal Text-Only Breadcrumb Path Navigation */}
        {(activeFilePath || workspacePath) && (
          <div className="nav-breadcrumbs">
            {/* First Folder in Breadcrumbs (Workspace Root) */}
            <div
              className="breadcrumb-item workspace-root"
              title={`Workspace: ${currentDisplayName}`}
              onClick={onOpenWorkspace}
            >
              <span className="max-w-35 truncate">{currentDisplayName}</span>
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
        {/* Notifications Icon Button */}
        <button
          type="button"
          className="header-action-btn relative"
          onClick={(): void => alert('Notifications: All workspace systems operational.')}
          title="Notifications"
        >
          <Bell size={13} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-zinc-400" />
        </button>

        {/* Settings Icon Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={(): void => (onOpenSettings ? onOpenSettings() : alert('Settings Menu'))}
          title="Settings"
        >
          <Settings size={13} />
        </button>

        {/* User Profile Avatar with Account & Settings Dropdown */}
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            className={`header-user-avatar ${showAccountMenu ? 'active' : ''}`}
            onClick={(): void => setShowAccountMenu((prev) => !prev)}
            title="Account & Settings (Notie User)"
          >
            <span>DN</span>
          </button>

          {showAccountMenu && (
            <div className="notion-dropdown-popover header-account-popover">
              <div className="notion-popover-header">
                <img src={iconSvg} alt="Avatar" className="notion-popover-avatar" />
                <div className="notion-popover-user-info">
                  <span className="notion-popover-name">Notie User</span>
                  <span className="notion-popover-sub">dwaipayan.codes@gmail.com</span>
                </div>
              </div>

              <div className="notion-menu-divider" />

              <div className="notion-popover-section">
                <button
                  type="button"
                  className="notion-menu-item"
                  onClick={(): void => {
                    setShowAccountMenu(false)
                    onOpenSettings?.()
                  }}
                >
                  <Settings size={14} className="text-zinc-300 shrink-0" />
                  <span>Settings & Preferences</span>
                </button>
              </div>

              <div className="notion-menu-divider" />

              <div className="notion-popover-footer">
                <button
                  type="button"
                  className="notion-logout-btn"
                  onClick={(): void => {
                    setShowAccountMenu(false)
                    alert('Signed out of Notie workspace account.')
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-3 w-px bg-zinc-700/60 mx-0.5" />

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="window-controls">
          <button
            type="button"
            className="window-control-btn"
            onClick={(): void => window.api?.window?.minimize?.()}
            title="Minimize Window"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            className="window-control-btn"
            onClick={(): void => window.api?.window?.maximize?.()}
            title="Maximize / Restore Window"
          >
            <Square size={11} />
          </button>
          <button
            type="button"
            className="window-control-btn close-btn"
            onClick={(): void => window.api?.window?.close?.()}
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
