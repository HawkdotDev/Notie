import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import EmojiPicker from '../../EmojiPicker'
import { getPathKey } from '../../../utils/pathUtils'
import { WorkspaceIcon } from '../../../utils/fileIconUtils'
import WorkspaceRecentList from './WorkspaceRecentList'
import WorkspaceActionItems from './WorkspaceActionItems'

interface WorkspaceSelectorProps {
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

function WorkspaceSelector({
  workspacePath,
  workspaceName,
  workspaceIcons = {},
  onSetWorkspaceIcon,
  recentWorkspaces = [],
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onRenameWorkspace,
  onCreateFileAtRoot
}: WorkspaceSelectorProps): React.JSX.Element {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<boolean>(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)

  const currentDisplayName =
    workspaceName ||
    (workspacePath ? workspacePath.split(/[\\/]/).filter(Boolean).pop() : '') ||
    'Select Workspace'

  const currentIcon = workspacePath
    ? workspaceIcons[getPathKey(workspacePath)] || workspaceIcons[workspacePath]
    : undefined

  const handleCloseAll = useCallback((): void => {
    setShowWorkspaceMenu(false)
    setShowEmojiPicker(false)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        handleCloseAll()
      }
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleCloseAll()
      }
    }
    if (showWorkspaceMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showWorkspaceMenu, showEmojiPicker, handleCloseAll])

  return (
    <div className="relative flex-1 min-w-0" ref={workspaceMenuRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        className={`sidebar-workspace-trigger ${showWorkspaceMenu ? 'active' : ''}`}
        onClick={(): void => setShowWorkspaceMenu((prev) => !prev)}
        title={`Workspace: ${currentDisplayName} (Click to switch or manage)`}
      >
        <WorkspaceIcon name={currentDisplayName} icon={currentIcon} size={20} />
        <span className="sidebar-workspace-name truncate">{currentDisplayName}</span>
        <ChevronDown
          size={12}
          className={`sidebar-workspace-chevron shrink-0 transition-transform duration-150 ${
            showWorkspaceMenu ? 'rotate-180 text-zinc-200' : 'text-zinc-500'
          }`}
        />
      </button>

      {/* Workspace Switcher Popover */}
      {showWorkspaceMenu && (
        <div className="notion-dropdown-popover sidebar-workspace-popover">
          <div className="dropdown-section-title">WORKSPACES</div>

          <WorkspaceRecentList
            recentWorkspaces={recentWorkspaces}
            workspacePath={workspacePath}
            workspaceIcons={workspaceIcons}
            onSwitchWorkspace={onSwitchWorkspace}
            onRemoveRecentWorkspace={onRemoveRecentWorkspace}
            onCloseMenu={handleCloseAll}
          />

          <div className="notion-menu-divider" />

          <WorkspaceActionItems
            workspacePath={workspacePath}
            currentIcon={currentIcon}
            hasSetIconHandler={Boolean(onSetWorkspaceIcon)}
            onOpenEmojiPicker={(): void => setShowEmojiPicker(true)}
            onCreateFileAtRoot={onCreateFileAtRoot}
            onOpenWorkspace={onOpenWorkspace}
            onRenameWorkspace={onRenameWorkspace}
            onCloseWorkspace={onCloseWorkspace}
            onCloseMenu={handleCloseAll}
          />
        </div>
      )}

      {/* Emoji Picker Popover for Workspace Icon */}
      {showEmojiPicker && workspacePath && onSetWorkspaceIcon && (
        <div className="absolute top-10 left-0 z-1100">
          <EmojiPicker
            onSelect={(emoji): void => {
              onSetWorkspaceIcon(workspacePath, emoji)
              handleCloseAll()
            }}
            onClose={(): void => setShowEmojiPicker(false)}
            onRemove={
              currentIcon
                ? (): void => {
                    onSetWorkspaceIcon(workspacePath, null)
                    handleCloseAll()
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(WorkspaceSelector)
