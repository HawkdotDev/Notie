import React from 'react'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarBody from './sidebar/SidebarBody'
import type { SidebarViewMode } from './sidebar/SidebarBody'

export type { SidebarViewMode }

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
  onFileSelect: (filePath: string) => void
  onCreateFileAtRoot: () => void
  onOpenWorkspace: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onRenameWorkspace?: () => void
  onToggleSidebar?: () => void
  showSearchInput: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onStartResize: (e: React.MouseEvent) => void
  enabledPlugins?: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
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
        {/* Top Action Row: Header + Workspace Selector */}
        <SidebarHeader
          activeView={activeView}
          workspacePath={workspacePath}
          workspaceName={workspaceName}
          workspaceIcons={workspaceIcons}
          onSetWorkspaceIcon={onSetWorkspaceIcon}
          recentWorkspaces={recentWorkspaces}
          onOpenWorkspace={onOpenWorkspace}
          onCloseWorkspace={onCloseWorkspace}
          onSwitchWorkspace={onSwitchWorkspace}
          onRemoveRecentWorkspace={onRemoveRecentWorkspace}
          onRenameWorkspace={onRenameWorkspace}
          onCreateFileAtRoot={onCreateFileAtRoot}
          onToggleSidebar={onToggleSidebar}
        />

        {/* Main Body Area: Plugins, Tree, or Empty State */}
        <SidebarBody
          activeView={activeView}
          workspacePath={workspacePath}
          activeFilePath={activeFilePath}
          showSearchInput={showSearchInput}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onFileSelect={onFileSelect}
          fileIcons={fileIcons}
          onMetadataLoaded={onMetadataLoaded}
          enabledPlugins={enabledPlugins}
          onTogglePlugin={onTogglePlugin}
          onOpenWorkspace={onOpenWorkspace}
        />
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
