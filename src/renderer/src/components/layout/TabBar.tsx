import React from 'react'
import { X, Plus } from 'lucide-react'
import { OpenFileInfo } from '../../types'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'
import { getPathKey, normalizePath } from '../../utils/pathUtils'

interface TabBarProps {
  openFiles: OpenFileInfo[]
  activeFilePath: string | null
  fileIcons?: Record<string, string>
  workspacePath?: string | null
  unsavedFiles?: Record<string, boolean>
  onTabSelect: (filePath: string) => void
  onTabClose: (filePath: string) => void
  onCreateFileAtRoot?: () => void
}

function TabBarComponent({
  openFiles,
  activeFilePath,
  fileIcons,
  workspacePath,
  unsavedFiles,
  onTabSelect,
  onTabClose,
  onCreateFileAtRoot
}: TabBarProps): React.JSX.Element | null {
  if (openFiles.length === 0) return null

  return (
    <div className="header-tabs-container flex-1 min-w-0">
      {openFiles.map((file) => {
        const isActive = activeFilePath === file.path
        const isUnsaved = unsavedFiles
          ? !!unsavedFiles[file.path] ||
            !!unsavedFiles[getPathKey(file.path)] ||
            !!unsavedFiles[normalizePath(file.path)]
          : false

        const rel = file.path
          .toLowerCase()
          .replace((workspacePath || '').toLowerCase(), '')
          .replace(/^[\\/]/, '')
        const customIcon = fileIcons ? fileIcons[rel] : undefined

        return (
          <div
            key={file.path}
            className={`header-tab ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}`}
            onClick={(): void => onTabSelect(file.path)}
            title={file.path}
          >
            <span className="header-tab-icon">
              {customIcon ? (
                <span className="text-[12px]">{customIcon}</span>
              ) : (
                <ProfessionalFileIcon fileName={file.name} className="scale-[0.9]" />
              )}
            </span>
            <span className="header-tab-name">{file.name}</span>
            {isUnsaved ? <span className="header-tab-unsaved-dot" title="Unsaved changes" /> : null}
            <button
              type="button"
              className="header-tab-close"
              onClick={(e): void => {
                e.stopPropagation()
                onTabClose(file.path)
              }}
              title="Close tab"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
        )
      })}
      {onCreateFileAtRoot && (
        <button
          type="button"
          className="header-tab-add-btn"
          onClick={onCreateFileAtRoot}
          title="New File Tab"
        >
          <Plus size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

export default React.memo(TabBarComponent)
