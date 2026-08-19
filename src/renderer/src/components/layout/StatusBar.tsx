import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2, SlidersHorizontal, Check } from 'lucide-react'
import { StatusStatsConfig } from '../../types'

interface StatusBarProps {
  activeFilePath: string | null
  activeFileContent?: string
  stats?: { lines: number; words: number; chars: number; readingTimeMinutes: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
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
  },
  onToggleStat
}: StatusBarProps): React.JSX.Element | null {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const optionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setIsOptionsOpen(false)
      }
    }
    if (isOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOptionsOpen])

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

  // Build the list of active stats for the bottom right pill
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
      {/* 1. Floating Saved Status on the Bottom-Left */}
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

      {/* 3. Floating Metrics Options Icon Dropdown in the Top-Right Corner */}
      {onToggleStat && (
        <div ref={optionsRef} className="floating-editor-metrics-topright">
          <button
            type="button"
            className={`floating-metrics-topright-trigger ${isOptionsOpen ? 'active' : ''}`}
            onClick={(): void => setIsOptionsOpen((prev) => !prev)}
            title="Metrics Options"
          >
            <SlidersHorizontal size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
          </button>

          {/* Floating Dropdown Options Menu */}
          {isOptionsOpen && (
            <div className="floating-metrics-topright-menu">
              <div className="floating-metrics-topright-header">
                <span className="font-semibold text-zinc-300">Metrics</span>
                <span className="text-[10px] text-zinc-500 font-mono">Options</span>
              </div>

              <div className="floating-metrics-topright-list">
                <div
                  className={`widget-menu-item compact ${statsConfig.showWords ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showWords')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">Word Count</span>
                  <div className={`widget-checkbox ${statsConfig.showWords ? 'checked' : ''}`}>
                    {statsConfig.showWords && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item compact ${statsConfig.showLines ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showLines')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">
                    Line Count (&quot;12 lines&quot;)
                  </span>
                  <div className={`widget-checkbox ${statsConfig.showLines ? 'checked' : ''}`}>
                    {statsConfig.showLines && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item compact ${statsConfig.showSpaces ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showSpaces')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">
                    Number of Spaces
                  </span>
                  <div className={`widget-checkbox ${statsConfig.showSpaces ? 'checked' : ''}`}>
                    {statsConfig.showSpaces && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item compact ${statsConfig.showChars ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showChars')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">
                    Character Count
                  </span>
                  <div className={`widget-checkbox ${statsConfig.showChars ? 'checked' : ''}`}>
                    {statsConfig.showChars && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item compact ${statsConfig.showReadingTime ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showReadingTime')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">
                    Reading Time
                  </span>
                  <div
                    className={`widget-checkbox ${statsConfig.showReadingTime ? 'checked' : ''}`}
                  >
                    {statsConfig.showReadingTime && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item compact ${statsConfig.showSavedBadge ? 'selected' : ''}`}
                  onClick={(): void => onToggleStat('showSavedBadge')}
                >
                  <span className="widget-title text-xs font-normal text-zinc-300">
                    Floating Saved Badge
                  </span>
                  <div className={`widget-checkbox ${statsConfig.showSavedBadge ? 'checked' : ''}`}>
                    {statsConfig.showSavedBadge && <Check size={11} />}
                  </div>
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
