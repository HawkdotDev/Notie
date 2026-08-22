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
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onStartResize: (e: React.MouseEvent) => void
  enabledPlugins?: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenSettings?: () => void
  onSwitchView?: (view: SidebarViewMode) => void
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
  fileIcons,
  onMetadataLoaded,
  onStartResize,
  enabledPlugins = {},
  onTogglePlugin,
  onOpenSettings,
  onSwitchView
}: SidebarProps): React.JSX.Element {
  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={{
        width: sidebarCollapsed ? 0 : `${sidebarWidth}px`
      }}
      aria-hidden={sidebarCollapsed}
    >
      <div
        className="sidebar-content flex flex-col h-full min-w-0 relative"
        style={{
          width: `${sidebarWidth}px`,
          minWidth: `${sidebarWidth}px`
        }}
      >
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
        />

        {/* Main Body Area: Plugins, Tree, or Empty State */}
        <SidebarBody
          activeView={activeView}
          workspacePath={workspacePath}
          activeFilePath={activeFilePath}
          onCreateFileAtRoot={onCreateFileAtRoot}
          onFileSelect={onFileSelect}
          fileIcons={fileIcons}
          onMetadataLoaded={onMetadataLoaded}
          enabledPlugins={enabledPlugins}
          onTogglePlugin={onTogglePlugin}
          onOpenWorkspace={onOpenWorkspace}
          onOpenSettings={onOpenSettings}
          onSwitchView={onSwitchView}
        />
      </div>

      {/* Resize handle bar */}
      {!sidebarCollapsed && (
        <div
          className={`sidebar-resizer ${isResizing ? 'is-active' : ''}`}
          onMouseDown={onStartResize}
        />
      )}
    </aside>
  )
}

export default React.memo(Sidebar)
