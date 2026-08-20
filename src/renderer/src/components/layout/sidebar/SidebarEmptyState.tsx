import React from 'react'
import { FolderOpen } from 'lucide-react'

interface SidebarEmptyStateProps {
  onOpenWorkspace: () => void
}

function SidebarEmptyState({ onOpenWorkspace }: SidebarEmptyStateProps): React.JSX.Element {
  return (
    <div className="sidebar-empty-wrapper flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="sidebar-empty-card flex flex-col items-center p-5 rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/30 w-full max-w-50">
        <div className="w-9 h-9 rounded-md bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center mb-3 text-zinc-400">
          <FolderOpen size={18} strokeWidth={1.75} />
        </div>
        <p className="text-xs font-medium text-zinc-300 mb-1">No Workspace</p>
        <p className="text-[11px] text-zinc-500 mb-3.5 leading-relaxed">
          Open a folder to start creating and editing notes.
        </p>
        <button
          type="button"
          className="sidebar-empty-btn w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-zinc-200 text-xs font-medium rounded-md border border-zinc-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          onClick={onOpenWorkspace}
        >
          <FolderOpen size={13} strokeWidth={1.75} />
          <span>Open Folder</span>
        </button>
      </div>
    </div>
  )
}

export default React.memo(SidebarEmptyState)
