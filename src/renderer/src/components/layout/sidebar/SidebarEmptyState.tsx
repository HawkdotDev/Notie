import React from 'react'
import { Folder, FolderPlus } from 'lucide-react'

interface SidebarEmptyStateProps {
  onOpenWorkspace: () => void
}

function SidebarEmptyState({ onOpenWorkspace }: SidebarEmptyStateProps): React.JSX.Element {
  return (
    <div className="sidebar-empty flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="sidebar-empty-icon mb-3">
        <Folder size={28} className="text-zinc-600" />
      </div>
      <p className="sidebar-empty-text text-xs text-zinc-400 mb-4">No workspace folder open</p>
      <button
        type="button"
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
        onClick={onOpenWorkspace}
      >
        <FolderPlus size={13} />
        <span>Open Folder</span>
      </button>
    </div>
  )
}

export default React.memo(SidebarEmptyState)
