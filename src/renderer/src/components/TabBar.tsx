import React from 'react'
import { X } from 'lucide-react'

interface OpenFile {
  name: string
  path: string
}

interface TabBarProps {
  openFiles: OpenFile[]
  activeFilePath: string | null
  unsavedFiles: Record<string, boolean>
  onTabSelect: (filePath: string) => void
  onTabClose: (filePath: string) => void
}

export default function TabBar({
  openFiles,
  activeFilePath,
  unsavedFiles,
  onTabSelect,
  onTabClose
}: TabBarProps): React.JSX.Element {
  if (openFiles.length === 0) {
    return <div className="tab-bar" style={{ display: 'none' }} />
  }

  return (
    <div className="tab-bar">
      {openFiles.map((file) => {
        const isActive = activeFilePath === file.path
        const isUnsaved = !!unsavedFiles[file.path]

        return (
          <div
            key={file.path}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={(): void => onTabSelect(file.path)}
            title={file.path}
          >
            <span className="tab-name">{file.name}</span>
            {isUnsaved && <span className="tab-dot" title="Unsaved changes" />}
            <span
              className="tab-close"
              onClick={(e): void => {
                e.stopPropagation()
                onTabClose(file.path)
              }}
            >
              <X size={12} />
            </span>
          </div>
        )
      })}
    </div>
  )
}
