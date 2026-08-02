import React from 'react'
import { OpenFileInfo } from '../../types'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'

interface TabBarProps {
  openFiles: OpenFileInfo[]
  activeFilePath: string | null
  onTabSelect: (filePath: string) => void
  onTabClose: (filePath: string) => void
  onCreateFileAtRoot: () => void
}

function TabBarComponent({
  openFiles,
  activeFilePath,
  onTabSelect,
  onTabClose,
  onCreateFileAtRoot
}: TabBarProps): React.JSX.Element | null {
  if (openFiles.length === 0) return null

  return (
    <div className="header-tabs-container flex-1 min-w-0">
      {openFiles.map((file) => {
        const isActive = activeFilePath === file.path
        return (
          <div
            key={file.path}
            className={`header-tab ${isActive ? 'active' : ''}`}
            onClick={(): void => onTabSelect(file.path)}
          >
            <span className="header-tab-icon">
              <ProfessionalFileIcon fileName={file.name} className="scale-90" />
            </span>
            <span>{file.name}</span>
            <span
              className="header-tab-close"
              onClick={(e): void => {
                e.stopPropagation()
                onTabClose(file.path)
              }}
            >
              ×
            </span>
          </div>
        )
      })}
      <button className="titlebar-add-btn" onClick={onCreateFileAtRoot} title="New Tab">
        +
      </button>
    </div>
  )
}

export default React.memo(TabBarComponent)
