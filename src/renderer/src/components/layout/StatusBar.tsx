import React from 'react'
import { CheckCircle2, Code2 } from 'lucide-react'

interface StatusBarProps {
  workspacePath?: string | null
  sidebarWidth?: number
  sidebarCollapsed?: boolean
  isResizing?: boolean
  activeFilePath: string | null
  activeFileContent?: string
  stats?: { lines: number; words: number; chars: number; readingTimeMinutes: number }
  cursorPosition: { line: number; column: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
  onToggleRightPanel?: () => void
}

function StatusBar({
  sidebarWidth = 240,
  sidebarCollapsed = false,
  isResizing = false,
  activeFilePath,
  activeFileContent,
  stats,
  cursorPosition,
  autoSaveEnabled,
  activeUnsaved
}: StatusBarProps): React.JSX.Element {
  const getLanguage = (filePath: string | null): { name: string; color: string } => {
    if (!filePath) return { name: 'Markdown', color: 'text-zinc-400' }
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    switch (ext) {
      case 'py':
        return { name: 'Python', color: 'text-zinc-300' }
      case 'js':
      case 'jsx':
        return { name: 'JavaScript', color: 'text-yellow-400' }
      case 'ts':
      case 'tsx':
        return { name: 'TypeScript', color: 'text-blue-400' }
      case 'html':
        return { name: 'HTML', color: 'text-orange-400' }
      case 'css':
      case 'scss':
        return { name: 'CSS', color: 'text-sky-400' }
      case 'json':
        return { name: 'JSON', color: 'text-amber-400' }
      case 'md':
        return { name: 'Markdown', color: 'text-emerald-400' }
      default:
        return { name: 'Plain Text', color: 'text-zinc-400' }
    }
  }

  const lang = getLanguage(activeFilePath)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const byteSize = activeFileContent ? new TextEncoder().encode(activeFileContent).length : 0
  const formattedFileSize = formatFileSize(byteSize)

  // Multithreaded background content statistics
  const wordCount =
    stats?.words ??
    (activeFileContent ? activeFileContent.trim().split(/\s+/).filter(Boolean).length : 0)
  const charCount = stats?.chars ?? (activeFileContent ? activeFileContent.length : 0)

  const renderSidebarFileItems = (): React.JSX.Element => (
    <>
      {/* Language / File Type Mode */}
      <div
        className="status-pill-item language-pill hoverable"
        title={`Language Mode: ${lang.name}`}
      >
        <Code2 size={11} className={`${lang.color} shrink-0`} />
        <span>{lang.name}</span>
      </div>

      <div className="status-divider" />

      {/* File Size */}
      <div className="status-pill-item mono hoverable" title={`File Size: ${byteSize} bytes`}>
        <span>{formattedFileSize}</span>
      </div>
    </>
  )

  const renderSavedBadge = (): React.JSX.Element => (
    <div className="status-pill-item" title={autoSaveEnabled ? 'Autosave active' : 'Autosave off'}>
      {activeUnsaved ? (
        <>
          <span className="w-1.5 h-1.5 bg-amber-400" />
          <span className="text-amber-300">Unsaved</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
          <span>Saved</span>
        </>
      )}
    </div>
  )

  return (
    <footer className="status-bar">
      {/* 1. Sidebar Bottom Section (aligned with Sidebar width) */}
      <div
        className={`status-bar-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
        style={{
          width: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
          minWidth: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
          maxWidth: sidebarCollapsed ? '0px' : `${sidebarWidth}px`
        }}
      >
        <div className="status-sidebar-content">{renderSidebarFileItems()}</div>
      </div>

      {/* 2. Main Workspace Bottom Section */}
      <div className="status-bar-main">
        <div className="status-main-left">
          {sidebarCollapsed && (
            <>
              {renderSidebarFileItems()}
              <div className="status-divider" />
            </>
          )}
          {renderSavedBadge()}
        </div>

        <div className="status-right">
          {/* Cursor & Word Stats */}
          <div
            className="status-pill-item mono hoverable"
            title={`Line ${cursorPosition.line}, Column ${cursorPosition.column} | ${wordCount} words, ${charCount} characters`}
          >
            <span>
              Ln {cursorPosition.line}, Col {cursorPosition.column} ({wordCount} words)
            </span>
          </div>

          <div className="status-divider" />

          {/* Editor Encoding & Indentation */}
          <div className="status-pill-item hoverable" title="Indentation Spaces">
            <span>Spaces: 4</span>
          </div>
          <div className="status-pill-item hoverable" title="File Encoding">
            <span>UTF-8</span>
          </div>
          <div className="status-pill-item hoverable" title="End of Line Sequence">
            <span>CRLF</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default React.memo(StatusBar)
