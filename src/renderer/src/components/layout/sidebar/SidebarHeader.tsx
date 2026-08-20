import React from 'react'
import { SidebarClose, Plus, Search } from 'lucide-react'
import WorkspaceSelector from './WorkspaceSelector'

interface SidebarHeaderProps {
  activeView?: 'explorer' | 'plugins'
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
  onToggleSidebar?: () => void
  showSearchInput?: boolean
  onToggleSearchInput?: () => void
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
  onCreateFileAtRoot,
  onToggleSidebar,
  showSearchInput = false,
  onToggleSearchInput
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

      {/* Action Buttons: New File, Search, Sidebar Toggle */}
      <div className="sidebar-header-buttons flex items-center gap-1">
        {workspacePath && activeView === 'explorer' && (
          <>
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={onCreateFileAtRoot}
              title="New Note (Ctrl+N)"
            >
              <Plus size={14} strokeWidth={1.75} />
            </button>

            {onToggleSearchInput && (
              <button
                type="button"
                className={`sidebar-action-btn ${showSearchInput ? 'active' : ''}`}
                onClick={onToggleSearchInput}
                title={showSearchInput ? 'Hide Search Filter' : 'Filter Files'}
              >
                <Search size={13} strokeWidth={1.75} />
              </button>
            )}
          </>
        )}

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
  )
}

export default React.memo(SidebarHeader)
