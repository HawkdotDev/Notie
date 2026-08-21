import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
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
  // Toast animation state for "Saved" notification
  const [toastPhase, setToastPhase] = useState<'hidden' | 'visible' | 'fading'>('hidden')
  const prevUnsavedRef = useRef<boolean>(activeUnsaved)
  const prevFileRef = useRef<string | null>(activeFilePath)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // If the same file was unsaved and now became saved (autosave or manual save)
    if (
      prevFileRef.current === activeFilePath &&
      prevUnsavedRef.current === true &&
      !activeUnsaved
    ) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

      setToastPhase('visible')

      toastTimerRef.current = setTimeout(() => {
        setToastPhase('fading')
        fadeTimerRef.current = setTimeout(() => {
          setToastPhase('hidden')
        }, 350)
      }, 2200)
    }
    prevUnsavedRef.current = activeUnsaved
    prevFileRef.current = activeFilePath
  }, [activeUnsaved, activeFilePath])

  if (!activeFilePath) return null

  // Metric computations with fallback
  const lineCount = stats?.lines ?? (activeFileContent ? activeFileContent.split('\n').length : 0)
  const wordCount =
    stats?.words ?? (activeFileContent ? (activeFileContent.trim().match(/\S+/g) || []).length : 0)
  const charCount = stats?.chars ?? (activeFileContent ? activeFileContent.length : 0)
  const spaceCount = activeFileContent ? (activeFileContent.match(/[ \t]/g) || []).length : 0
  const readingTime = stats?.readingTimeMinutes ?? Math.max(1, Math.ceil(wordCount / 200))

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
      {/* 1. Floating Saved / Unsaved Status on the Bottom-Left (Toast on save) */}
      {statsConfig.showSavedBadge && (activeUnsaved || toastPhase !== 'hidden') && (
        <div
          className={`floating-editor-statusbar-left ${
            toastPhase === 'visible'
              ? 'saved-toast'
              : toastPhase === 'fading'
                ? 'saved-toast fade-out'
                : ''
          }`}
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
                <span className="text-emerald-300 font-medium">Saved</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Document Stats on the Bottom-Right */}
      {activeStatItems.length > 0 && (
        <div
          className="floating-editor-statusbar"
          title={`File: ${activeFilePath} | ~${readingTime} min read`}
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
