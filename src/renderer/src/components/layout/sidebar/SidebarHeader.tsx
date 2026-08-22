import React from 'react'
import WorkspaceSelector from './WorkspaceSelector'
import type { SidebarViewMode } from './SidebarBody'

interface SidebarHeaderProps {
  activeView?: SidebarViewMode
  workspacePath: string | null
  workspaceName?: string
  workspaceIcons?: Record<string, string>
  onSetWorkspaceIcon?: (workspacePath: string, icon: string | null) => void
  recentWorkspaces?: { path: string; name: string }[]
  onOpenWorkspace: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onRenameWorkspace?: () => void
  onCreateFileAtRoot: () => void
}

function SidebarHeader({
  activeView = 'explorer',
  workspacePath,
  workspaceName,
  workspaceIcons,
  onSetWorkspaceIcon,
  recentWorkspaces,
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onRenameWorkspace,
  onCreateFileAtRoot
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="sidebar-top-actions">
      {activeView === 'plugins' ? (
        <div className="sidebar-header-title">
          <span>Extensions</span>
        </div>
      ) : (
        <WorkspaceSelector
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
      )}

      <div className="sidebar-header-divider" />
    </div>
  )
}

export default React.memo(SidebarHeader)
