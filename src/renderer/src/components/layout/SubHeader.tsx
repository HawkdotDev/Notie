import React from 'react'
import { FileText, Network, Search, Blocks } from 'lucide-react'
import { ViewMode, WidgetState } from '../../types'
import WidgetsMenu from './subheader/WidgetsMenu'
import ViewModeMenu from './subheader/ViewModeMenu'
import ShareMenu from './subheader/ShareMenu'

interface SubHeaderProps {
  onSaveActiveFile?: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  setViewMode?: (mode: ViewMode) => void
  onOpenWorkspace?: () => void
  onCreateFileAtRoot?: () => void
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  activeUnsaved: boolean
  widgetState: WidgetState
  onToggleWidget: (widget: keyof WidgetState) => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  showSearchInput?: boolean
  onToggleSearchInput?: () => void
  showTabs?: boolean
  onToggleTabs?: () => void
  sidebarView?: 'explorer' | 'plugins'
  sidebarCollapsed?: boolean
  onTogglePluginsView?: () => void
  onSwitchToFiles?: () => void
  enabledPluginsCount?: number
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
}

function SubHeader({
  viewMode,
  onToggleViewMode,
  setViewMode,
  autoSaveEnabled,
  onToggleAutoSave,
  activeUnsaved,
  widgetState,
  onToggleWidget,
  showRightSidebar,
  onToggleRightSidebar,
  showSearchInput,
  onToggleSearchInput,
  showTabs = true,
  onToggleTabs,
  sidebarView = 'explorer',
  sidebarCollapsed = false,
  onTogglePluginsView,
  onSwitchToFiles,
  enabledPluginsCount = 0,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink
}: SubHeaderProps): React.JSX.Element {
  return (
    <div className="app-actions-bar relative">
      {/* Left Toolbar Action Pills */}
      <div className="actions-bar-left">
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
            fill="currentColor"
            className={
              viewMode === 'editor' && (sidebarView === 'explorer' || sidebarCollapsed)
                ? 'text-zinc-300'
                : ''
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
          <Network
            size={13}
            fill="currentColor"
            className={viewMode === 'graph' ? 'text-zinc-300' : ''}
          />
          <span>Graph</span>
        </button>

        {/* Divider between Graph and the rest of tabs */}
        <div className="sub-header-divider" />

        {/* 3. Document View Options Dropdown */}
        <ViewModeMenu
          showTabs={showTabs}
          onToggleTabs={onToggleTabs}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={onToggleRightSidebar}
        />

        {/* 4. Global Search Tab */}
        {onToggleSearchInput && (
          <button
            className={`action-pill-btn ${showSearchInput ? 'active' : ''}`}
            onClick={onToggleSearchInput}
            title="Toggle File Search"
          >
            <Search size={13} className={showSearchInput ? 'text-zinc-300' : ''} />
            <span>Search</span>
          </button>
        )}

        {/* 5. Plugins Button */}
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

      {/* Right Toolbar Actions */}
      <div className="actions-bar-right flex items-center gap-2">
        {/* Share & Export Dropdown */}
        <ShareMenu
          onExportHTML={onExportHTML}
          onExportText={onExportText}
          onExportMarkdown={onExportMarkdown}
          onCopyLink={onCopyLink}
        />

        {/* Autosave Toggle Switch */}
        <div
          className="header-toggle-group cursor-pointer"
          onClick={onToggleAutoSave}
          title={`Autosave is ${autoSaveEnabled ? 'Enabled' : 'Disabled'}`}
        >
          <span>Autosave</span>
          <div className={`toggle-switch ${autoSaveEnabled ? 'active' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SubHeader)
