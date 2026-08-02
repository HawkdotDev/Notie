import React from 'react'
import { Terminal, Globe, FileText } from 'lucide-react'
import { OpenFileInfo } from '../../types'

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

  const getTabIcon = (fileName: string): React.JSX.Element => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (ext === 'py') return <Terminal size={12} className="text-purple-400" />
    if (ext === 'html') return <Globe size={12} className="text-orange-400" />
    return <FileText size={12} className="text-zinc-400" />
  }

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
            <span className="header-tab-icon">{getTabIcon(file.name)}</span>
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
