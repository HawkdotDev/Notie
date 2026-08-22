import React, { useState, useEffect, useRef } from 'react'
import { Minus, Square, X, Bell, Settings, FileText, Network, Blocks } from 'lucide-react'
import oinkLogo from '../../assets/oink.png'
import { ViewMode, WidgetState } from '../../types'
import WidgetsMenu from './subheader/WidgetsMenu'
import ViewModeMenu from './subheader/ViewModeMenu'

interface TopHeaderProps {
  onOpenSettings?: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  setViewMode?: (mode: ViewMode) => void
  sidebarView?: 'explorer' | 'search' | 'plugins'
  sidebarCollapsed?: boolean
  onTogglePluginsView?: () => void
  onSwitchToFiles?: () => void
  enabledPluginsCount?: number
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  widgetState: WidgetState
  onToggleWidget: (widget: keyof WidgetState) => void
  activeUnsaved: boolean
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  activeFilePath?: string | null
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function TopHeader({
  onOpenSettings,
  viewMode,
  onToggleViewMode,
  setViewMode,
  sidebarView = 'explorer',
  sidebarCollapsed = false,
  onTogglePluginsView,
  onSwitchToFiles,
  enabledPluginsCount = 0,
  showTabs = true,
  onToggleTabs,
  showRightSidebar,
  onToggleRightSidebar,
  widgetState,
  onToggleWidget,
  activeUnsaved,
  autoSaveEnabled,
  onToggleAutoSave,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  activeFilePath,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile
}: TopHeaderProps): React.JSX.Element {
  const [showBrandPopover, setShowBrandPopover] = useState<boolean>(false)
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false)
  const brandPopoverRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (brandPopoverRef.current && !brandPopoverRef.current.contains(e.target as Node)) {
        setShowBrandPopover(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false)
      }
    }
    if (showBrandPopover || showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBrandPopover, showAccountMenu])

  return (
    <header
      className="top-header select-none"
      onDoubleClick={(): void => window.api?.window?.maximize?.()}
    >
      {/* LEFT SECTION: Logo & Core View Switchers */}
      <div className="top-header-left flex items-center gap-1.5 min-w-0">
        {/* Brand Menu Trigger Popover */}
        <div className="relative" ref={brandPopoverRef}>
          <button
            type="button"
            className={`window-brand-btn ${showBrandPopover ? 'active' : ''}`}
            onClick={(): void => setShowBrandPopover((prev) => !prev)}
            title="Oink Application Menu"
          >
            <img src={oinkLogo} alt="Oink Logo" className="w-3.5 h-3.5 object-contain" />
            <span className="window-title font-semibold tracking-tight text-xs">Oink</span>
          </button>

          {showBrandPopover && (
            <div className="notion-dropdown-popover brand-menu-popover">
              <div className="dropdown-section-title">APPLICATION</div>
              <button
                className="notion-menu-item"
                onClick={(): void => {
                  setShowBrandPopover(false)
                  if (onOpenSettings) onOpenSettings()
                }}
              >
                <Settings size={13} />
                <span>Preferences & Settings</span>
              </button>
              <div className="notion-menu-divider" />
              <div className="p-2 flex items-center justify-between text-zinc-500">
                <span className="text-xs font-semibold text-zinc-200">Oink</span>
                <span className="text-zinc-600 text-xs">|</span>
                <span className="text-xs text-zinc-400 font-mono">v0.1.0</span>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Pipe Separator */}
        <div className="header-pipe-separator" />

        {/* 1. File Editor Tab */}
        <button
          className={`action-pill-btn ${viewMode === 'editor' && (sidebarView === 'explorer' || sidebarCollapsed) ? 'active' : ''}`}
          onClick={(): void => {
            if (onSwitchToFiles) onSwitchToFiles()
            if (setViewMode) setViewMode('editor')
            else if (viewMode === 'graph') onToggleViewMode()
          }}
          title="Document Editor & File View"
        >
          <FileText
            size={13}
            className={
              viewMode === 'editor' && (sidebarView === 'explorer' || sidebarCollapsed)
                ? 'text-zinc-200'
                : 'text-zinc-400'
            }
          />
          <span>Files</span>
        </button>

        {/* 2. Knowledge Graph Tab */}
        <button
          className={`action-pill-btn ${viewMode === 'graph' ? 'active' : ''}`}
          onClick={(): void => {
            if (setViewMode) setViewMode('graph')
            else if (viewMode === 'editor') onToggleViewMode()
          }}
          title="Knowledge Graph View"
        >
          <Network size={13} className={viewMode === 'graph' ? 'text-zinc-200' : 'text-zinc-400'} />
          <span>Graph</span>
        </button>

        {/* Divider between Graph and the rest of tabs */}
        <div className="header-pipe-separator opacity-40" />

        {/* 3. Document View Options Dropdown */}
        <ViewModeMenu
          showTabs={showTabs}
          onToggleTabs={onToggleTabs}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={onToggleRightSidebar}
          showCover={showCover}
          showIcon={showIcon}
          showFileName={showFileName}
          isOnlyThisFile={isOnlyThisFile}
          activeFilePath={activeFilePath}
          onToggleCover={onToggleCover}
          onToggleIcon={onToggleIcon}
          onToggleFileName={onToggleFileName}
          onToggleOnlyThisFile={onToggleOnlyThisFile}
        />

        {/* 4. Plugins Button */}
        {onTogglePluginsView && (
          <button
            className={`action-pill-btn ${sidebarView === 'plugins' && !sidebarCollapsed ? 'active' : ''}`}
            onClick={onTogglePluginsView}
            title="Toggle Plugins & Extensions (replaces File View)"
          >
            <Blocks
              size={13}
              className={sidebarView === 'plugins' && !sidebarCollapsed ? 'text-zinc-200' : ''}
            />
            <span>Plugins</span>
            {enabledPluginsCount !== undefined && enabledPluginsCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                {enabledPluginsCount}
              </span>
            )}
          </button>
        )}

        {/* 6. Floating Widgets Dropdown */}
        <WidgetsMenu
          widgetState={widgetState}
          onToggleWidget={onToggleWidget}
          activeUnsaved={activeUnsaved}
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
        />
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
            title="Account & Settings (Oink User)"
          >
            <span>DN</span>
          </button>

          {showAccountMenu && (
            <div className="notion-dropdown-popover header-account-popover">
              <div className="notion-popover-header">
                <img src={oinkLogo} alt="Avatar" className="notion-popover-avatar" />
                <div className="notion-popover-user-info">
                  <span className="notion-popover-name">Oink User</span>
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
                    alert('Signed out of Oink workspace account.')
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
    </header>
  )
}

export default React.memo(TopHeader)
