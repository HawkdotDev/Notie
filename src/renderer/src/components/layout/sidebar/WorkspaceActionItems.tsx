import React from 'react'
import { Folder, FolderPlus, Plus, Edit3, XCircle, Smile } from 'lucide-react'

interface WorkspaceActionItemsProps {
  workspacePath: string | null
  currentIcon?: string
  hasSetIconHandler: boolean
  onOpenEmojiPicker: () => void
  onCreateFileAtRoot: () => void
  onOpenWorkspace: () => void
  onRenameWorkspace?: () => void
  onCloseWorkspace?: () => void
  onCloseMenu: () => void
}

function WorkspaceActionItems({
  workspacePath,
  currentIcon,
  hasSetIconHandler,
  onOpenEmojiPicker,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onRenameWorkspace,
  onCloseWorkspace,
  onCloseMenu
}: WorkspaceActionItemsProps): React.JSX.Element {
  return (
    <div className="notion-popover-section">
      {workspacePath && hasSetIconHandler && (
        <button type="button" className="notion-menu-item" onClick={onOpenEmojiPicker}>
          <Smile size={14} className="text-zinc-300 shrink-0" />
          <span>{currentIcon ? 'Change Workspace Icon...' : 'Add Workspace Icon...'}</span>
        </button>
      )}

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          onCreateFileAtRoot()
          onCloseMenu()
        }}
      >
        <Plus size={14} className="text-zinc-300 shrink-0" />
        <span>New File</span>
      </button>

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          window.dispatchEvent(new CustomEvent('create-root-folder'))
          onCloseMenu()
        }}
      >
        <FolderPlus size={14} className="text-zinc-300 shrink-0" />
        <span>New Folder</span>
      </button>

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          onOpenWorkspace()
          onCloseMenu()
        }}
      >
        <Folder size={14} className="text-zinc-300 shrink-0" />
        <span className="text-zinc-200 font-medium">Open Workspace Folder...</span>
      </button>

      {workspacePath && (
        <button
          type="button"
          className="notion-menu-item"
          onClick={(): void => {
            if (onRenameWorkspace) {
              onRenameWorkspace()
            } else {
              window.dispatchEvent(new CustomEvent('rename-root-folder'))
            }
            onCloseMenu()
          }}
        >
          <Edit3 size={14} className="text-zinc-300 shrink-0" />
          <span>Rename Workspace...</span>
        </button>
      )}

      {workspacePath && onCloseWorkspace && (
        <button
          type="button"
          className="notion-menu-item text-rose-400 hover:text-rose-300"
          onClick={(): void => {
            onCloseWorkspace()
            onCloseMenu()
          }}
        >
          <XCircle size={14} className="text-rose-400 shrink-0" />
          <span>Close Workspace</span>
        </button>
      )}
    </div>
  )
}

export default React.memo(WorkspaceActionItems)
