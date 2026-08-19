import React from 'react'
import { CheckCircle2, Code2 } from 'lucide-react'
import { StatusStatsConfig } from '../../types'

interface StatusBarProps {
  activeFilePath: string | null
  activeFileContent?: string
  stats?: { lines: number; words: number; chars: number; readingTimeMinutes: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
  statsConfig?: StatusStatsConfig
}

function StatusBar({
  activeFilePath,
  activeFileContent,
  stats,
  autoSaveEnabled,
  activeUnsaved,
  statsConfig = {
    showWords: true,
    showLines: true,
    showChars: false,
    showSpaces: true,
    showReadingTime: false,
    showLanguage: true,
    showSavedBadge: true
  }
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
  const lineCount =
    stats?.lines ?? (activeFileContent ? activeFileContent.split(/\r?\n/).length : 1)
  const spaceCount = activeFileContent ? (activeFileContent.match(/ /g) || []).length : 0
  const readingTime = stats?.readingTimeMinutes ?? Math.max(1, Math.ceil(wordCount / 200))

  // Build the list of active stats for the right pill
  const activeStatItems: React.JSX.Element[] = []

  if (statsConfig.showWords) {
    activeStatItems.push(
      <div key="words" className="status-pill-item mono hoverable" title={`${wordCount} total words`}>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>
    )
  }

  if (statsConfig.showLines) {
    activeStatItems.push(
      <div key="lines" className="status-pill-item mono hoverable" title={`${lineCount} total lines`}>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
      </div>
    )
  }

  if (statsConfig.showSpaces) {
    activeStatItems.push(
      <div key="spaces" className="status-pill-item mono hoverable" title={`${spaceCount} total spaces`}>
        <span>{spaceCount} {spaceCount === 1 ? 'space' : 'spaces'}</span>
      </div>
    )
  }

  if (statsConfig.showChars) {
    activeStatItems.push(
      <div key="chars" className="status-pill-item mono hoverable" title={`${charCount} total characters`}>
        <span>{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
      </div>
    )
  }

  if (statsConfig.showReadingTime) {
    activeStatItems.push(
      <div key="reading" className="status-pill-item mono hoverable" title={`Estimated reading time`}>
        <span>~{readingTime} min</span>
      </div>
    )
  }

  if (statsConfig.showLanguage) {
    activeStatItems.push(
      <div
        key="lang"
        className="status-pill-item language-pill hoverable"
        title={`Language: ${lang.name} (${formattedFileSize})`}
      >
        <Code2 size={13} strokeWidth={1.5} className={`${lang.color} shrink-0`} />
        <span>{lang.name}</span>
      </div>
    )
  }

  return (
    <>
      {/* 1. Floating Saved Status on the Left */}
      {statsConfig.showSavedBadge && (
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
      )}

      {/* 2. Floating Document Stats on the Right */}
      {activeStatItems.length > 0 && (
        <div
          className="floating-editor-statusbar"
          title={`File: ${activeFilePath} | ${byteSize} bytes | ~${readingTime} min read`}
        >
          {activeStatItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <div className="status-divider" />}
              {item}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  )
}

export default React.memo(StatusBar)

