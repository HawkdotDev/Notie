import React from 'react'
import { CheckCircle2, Code2 } from 'lucide-react'

interface StatusBarProps {
  activeFilePath: string | null
  activeFileContent?: string
  stats?: { lines: number; words: number; chars: number; readingTimeMinutes: number }
  cursorPosition: { line: number; column: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
}

function StatusBar({
  activeFilePath,
  activeFileContent,
  stats,
  cursorPosition,
  autoSaveEnabled,
  activeUnsaved
}: StatusBarProps): React.JSX.Element | null {
  if (!activeFilePath) return null

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
  const readingTime = stats?.readingTimeMinutes ?? Math.max(1, Math.ceil(wordCount / 200))

  return (
    <>
      {/* 1. Floating Saved Status on the Left */}
      <div
        className="floating-editor-statusbar-left"
        title={autoSaveEnabled ? 'Autosave active' : 'Autosave disabled'}
      >
        <div className="status-pill-item">
          {activeUnsaved ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-medium">Unsaved</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} strokeWidth={1.75} className="text-emerald-400 shrink-0" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Floating Document Stats on the Right */}
      <div
        className="floating-editor-statusbar"
        title={`File: ${activeFilePath} | ${byteSize} bytes | ~${readingTime} min read`}
      >
        {/* Word Count */}
        <div
          className="status-pill-item mono hoverable"
          title={`${wordCount} words, ${charCount} characters, ~${readingTime} min read`}
        >
          <span>{wordCount} words</span>
        </div>

        <div className="status-divider" />

        {/* Cursor Coordinates */}
        <div
          className="status-pill-item mono hoverable"
          title={`Cursor: Line ${cursorPosition.line}, Column ${cursorPosition.column}`}
        >
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        </div>

        <div className="status-divider" />

        {/* Language Mode */}
        <div
          className="status-pill-item language-pill hoverable"
          title={`Language: ${lang.name} (${formattedFileSize})`}
        >
          <Code2 size={13} strokeWidth={1.5} className={`${lang.color} shrink-0`} />
          <span>{lang.name}</span>
        </div>
      </div>
    </>
  )
}

export default React.memo(StatusBar)
