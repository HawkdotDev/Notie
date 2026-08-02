import React from 'react'
import { AlertTriangle, Info, Radio, CheckCircle2, Code2, Bell } from 'lucide-react'

interface StatusBarProps {
  workspacePath: string | null
  activeFilePath: string | null
  activeFileContent?: string
  cursorPosition: { line: number; column: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
  onToggleRightPanel?: () => void
}

export default function StatusBar({
  workspacePath,
  activeFilePath,
  activeFileContent,
  cursorPosition,
  autoSaveEnabled,
  activeUnsaved,
  onToggleRightPanel
}: StatusBarProps): React.JSX.Element {
  const getLanguage = (filePath: string | null): { name: string; color: string } => {
    if (!filePath) return { name: 'Markdown', color: 'text-purple-400' }
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    switch (ext) {
      case 'py':
        return { name: 'Python', color: 'text-purple-400' }
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
  const workspaceName = workspacePath ? workspacePath.split(/[\\/]/).pop() : null

  // Calculate live content statistics
  const wordCount = activeFileContent
    ? activeFileContent.trim().split(/\s+/).filter(Boolean).length
    : 0
  const charCount = activeFileContent ? activeFileContent.length : 0

  return (
    <footer className="status-bar">
      <div className="status-left">
        {/* Workspace Connection Indicator */}
        <div
          className="status-pill-item hoverable"
          title={workspacePath ? `Connected to: ${workspacePath}` : 'No workspace connected'}
        >
          <span className={`status-dot ${workspacePath ? 'connected' : 'disconnected'}`} />
          <span className="status-text">{workspaceName ? workspaceName : 'No Workspace'}</span>
        </div>

        <div className="status-divider" />

        {/* Diagnostics / Errors & Warnings */}
        <div
          className="status-pill-item hoverable cursor-pointer"
          title="Click to view diagnostics in Assistant Panel"
          onClick={onToggleRightPanel}
        >
          <AlertTriangle size={11} className="text-amber-400 shrink-0" />
          <span>4</span>
        </div>

        <div
          className="status-pill-item hoverable cursor-pointer"
          title="Click to view info in Assistant Panel"
          onClick={onToggleRightPanel}
        >
          <Info size={11} className="text-sky-400 shrink-0" />
          <span>0</span>
        </div>

        <div className="status-divider" />

        {/* Live Share */}
        <div
          className="status-pill-item hoverable cursor-pointer"
          title="Live Share Session Active"
          onClick={(): void => alert('Live Share: Session connected.')}
        >
          <Radio size={11} className="text-purple-400 shrink-0 animate-pulse" />
          <span>Live share</span>
        </div>

        {/* Auto save */}
        <div
          className="status-pill-item"
          title={autoSaveEnabled ? 'Autosave active' : 'Autosave off'}
        >
          {activeUnsaved ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-300">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
              <span>Auto saved</span>
            </>
          )}
        </div>
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

        <div className="status-divider" />

        {/* Language Mode */}
        <div
          className="status-pill-item language-pill hoverable"
          title={`Language Mode: ${lang.name}`}
        >
          <Code2 size={11} className={`${lang.color} shrink-0`} />
          <span>{lang.name}</span>
        </div>

        {/* Notifications Icon */}
        <button className="status-icon-btn" title="Notifications">
          <Bell size={11} />
        </button>
      </div>
    </footer>
  )
}
