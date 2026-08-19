import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2, ChevronUp, FileText, AlignLeft, Hash, Clock } from 'lucide-react'
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
    showLanguage: false,
    showSavedBadge: true
  }
}: StatusBarProps): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!activeFilePath) return null

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
      <div key="words" className="status-pill-item mono" title={`${wordCount} total words`}>
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>
    )
  }

  if (statsConfig.showLines) {
    activeStatItems.push(
      <div key="lines" className="status-pill-item mono" title={`${lineCount} total lines`}>
        <span>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
      </div>
    )
  }

  if (statsConfig.showSpaces) {
    activeStatItems.push(
      <div key="spaces" className="status-pill-item mono" title={`${spaceCount} total spaces`}>
        <span>
          {spaceCount} {spaceCount === 1 ? 'space' : 'spaces'}
        </span>
      </div>
    )
  }

  if (statsConfig.showChars) {
    activeStatItems.push(
      <div key="chars" className="status-pill-item mono" title={`${charCount} total characters`}>
        <span>
          {charCount} {charCount === 1 ? 'char' : 'chars'}
        </span>
      </div>
    )
  }

  if (statsConfig.showReadingTime) {
    activeStatItems.push(
      <div key="reading" className="status-pill-item mono" title={`Estimated reading time`}>
        <span>~{readingTime} min</span>
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

      {/* 2. Floating Document Stats Dropdown on the Right */}
      {activeStatItems.length > 0 && (
        <div ref={dropdownRef} className="floating-editor-statusbar-container">
          <button
            type="button"
            className={`floating-editor-statusbar ${isOpen ? 'active' : ''}`}
            onClick={(): void => setIsOpen((prev) => !prev)}
            title="Document Metrics (Click to toggle details)"
          >
            {activeStatItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <div className="status-divider" />}
                {item}
              </React.Fragment>
            ))}
            <div className="status-divider" />
            <ChevronUp
              size={12}
              className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                isOpen ? 'rotate-180 text-zinc-300' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Details Card */}
          {isOpen && (
            <div className="floating-metrics-dropdown-menu">
              <div className="floating-metrics-dropdown-header">
                <span className="font-semibold text-zinc-300">Document Metrics</span>
                <span className="text-[10px] text-zinc-500 font-mono">Live</span>
              </div>

              <div className="floating-metrics-dropdown-list">
                <div className="metric-dropdown-row">
                  <div className="metric-dropdown-label">
                    <FileText size={12} className="text-zinc-400" />
                    <span>Words</span>
                  </div>
                  <span className="metric-dropdown-value">{wordCount.toLocaleString()}</span>
                </div>

                <div className="metric-dropdown-row">
                  <div className="metric-dropdown-label">
                    <AlignLeft size={12} className="text-zinc-400" />
                    <span>Lines</span>
                  </div>
                  <span className="metric-dropdown-value">{lineCount.toLocaleString()}</span>
                </div>

                <div className="metric-dropdown-row">
                  <div className="metric-dropdown-label">
                    <Hash size={12} className="text-zinc-400" />
                    <span>Spaces</span>
                  </div>
                  <span className="metric-dropdown-value">{spaceCount.toLocaleString()}</span>
                </div>

                <div className="metric-dropdown-row">
                  <div className="metric-dropdown-label">
                    <FileText size={12} className="text-zinc-400" />
                    <span>Characters</span>
                  </div>
                  <span className="metric-dropdown-value">{charCount.toLocaleString()}</span>
                </div>

                <div className="metric-dropdown-row">
                  <div className="metric-dropdown-label">
                    <Clock size={12} className="text-zinc-400" />
                    <span>Reading Time</span>
                  </div>
                  <span className="metric-dropdown-value">~{readingTime} min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default React.memo(StatusBar)
