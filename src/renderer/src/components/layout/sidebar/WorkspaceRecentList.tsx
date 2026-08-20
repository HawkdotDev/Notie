import React from 'react'
import { Check, Trash2 } from 'lucide-react'
import { getPathKey } from '../../../utils/pathUtils'
import { WorkspaceIcon } from '../../../utils/fileIconUtils'

interface WorkspaceRecentListProps {
  recentWorkspaces: { path: string; name: string }[]
  workspacePath: string | null
  workspaceIcons: Record<string, string>
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onCloseMenu: () => void
}

function WorkspaceRecentList({
  recentWorkspaces,
  workspacePath,
  workspaceIcons,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onCloseMenu
}: WorkspaceRecentListProps): React.JSX.Element {
  if (recentWorkspaces.length === 0) {
    return <div className="px-2 py-1.5 text-[11px] text-zinc-500 italic">No recent workspaces</div>
  }

  return (
    <div className="dropdown-workspace-list">
      {recentWorkspaces.map((ws) => {
        const isActive = workspacePath && getPathKey(ws.path) === getPathKey(workspacePath)
        const wsIcon = workspaceIcons[getPathKey(ws.path)] || workspaceIcons[ws.path]
        return (
          <div
            key={ws.path}
            className={`notion-workspace-row ${isActive ? 'active' : ''}`}
            onClick={(): void => {
              if (onSwitchWorkspace) {
                onSwitchWorkspace(ws.path, ws.name)
              }
              onCloseMenu()
            }}
          >
            <WorkspaceIcon name={ws.name} icon={wsIcon} size={18} />
            <div className="flex-1 min-w-0">
              <div className="notion-row-name truncate text-xs">{ws.name}</div>
              <div className="text-[10px] text-zinc-500 truncate">{ws.path}</div>
            </div>
            {isActive && <Check size={14} className="text-zinc-200 shrink-0 ml-auto" />}
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
  )
}

export default React.memo(WorkspaceRecentList)
