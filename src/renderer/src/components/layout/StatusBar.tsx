import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Check,
  BarChart2,
  Image,
  Smile,
  FileText
} from 'lucide-react'
import { StatusStatsConfig } from '../../types'

interface StatusBarProps {
  activeFilePath: string | null
  activeFileContent?: string
  stats?: { lines: number; words: number; chars: number; readingTimeMinutes: number }
  autoSaveEnabled: boolean
  activeUnsaved: boolean
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
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
  onToggleStat,
  showCover = true,
  showIcon = true,
  showFileName = true,
  onToggleCover,
  onToggleIcon,
  onToggleFileName
}: StatusBarProps): React.JSX.Element | null {
  const [activeDropdown, setActiveDropdown] = useState<'opt1' | null>(null)
  const [metricsSubOpen, setMetricsSubOpen] = useState(true)
  const [iconCoverSubOpen, setIconCoverSubOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

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

      {/* 3. Floating Tool Dropdowns in Top-Right Corner (One after the other) */}
      <div ref={containerRef} className="floating-editor-tools-topright">
        {/* Option 1: Dropdown containing Metrics & Icon/Cover sub-dropdowns */}
        <div className="floating-tool-item">
          <button
            type="button"
            className={`floating-metrics-topright-trigger ${activeDropdown === 'opt1' ? 'active' : ''}`}
            onClick={(): void => setActiveDropdown((prev) => (prev === 'opt1' ? null : 'opt1'))}
            title="Metrics & Options"
          >
            <SlidersHorizontal size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
          </button>

          {activeDropdown === 'opt1' && (
            <div className="floating-metrics-topright-menu">
              {/* 1. Metrics Separate Card */}
              {onToggleStat && (
                <div className="options-card-section">
                  <div className="options-submenu-group">
                    <button
                      type="button"
                      className={`options-submenu-trigger ${metricsSubOpen ? 'expanded' : ''}`}
                      onClick={(): void => setMetricsSubOpen((p) => !p)}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 size={13} className="text-emerald-400 shrink-0" />
                        <span className="widget-title font-semibold">Metrics</span>
                      </div>
                      <ChevronDown
                        size={11}
                        className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                          metricsSubOpen ? 'rotate-180 text-zinc-300' : ''
                        }`}
                      />
                    </button>

                    {metricsSubOpen && (
                      <div className="options-submenu-content">
                        <div
                          className={`widget-menu-item compact ${statsConfig.showWords ? 'selected' : ''}`}
                          onClick={(): void => onToggleStat('showWords')}
                        >
                          <span className="widget-title text-xs font-normal text-zinc-300">
                            Word Count
                          </span>
                          <div
                            className={`widget-checkbox ${statsConfig.showWords ? 'checked' : ''}`}
                          >
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
                          <div
                            className={`widget-checkbox ${statsConfig.showLines ? 'checked' : ''}`}
                          >
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
                          <div
                            className={`widget-checkbox ${statsConfig.showSpaces ? 'checked' : ''}`}
                          >
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
                          <div
                            className={`widget-checkbox ${statsConfig.showChars ? 'checked' : ''}`}
                          >
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
                          <div
                            className={`widget-checkbox ${statsConfig.showSavedBadge ? 'checked' : ''}`}
                          >
                            {statsConfig.showSavedBadge && <Check size={11} />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Icon & Cover Separate Card */}
              <div className="options-card-section">
                <div className="options-submenu-group">
                  <button
                    type="button"
                    className={`options-submenu-trigger ${iconCoverSubOpen ? 'expanded' : ''}`}
                    onClick={(): void => setIconCoverSubOpen((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <Image size={13} strokeWidth={1.75} className="text-amber-400 shrink-0" />
                      <span className="widget-title font-semibold">Icon & Cover</span>
                    </div>
                    <ChevronDown
                      size={11}
                      className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                        iconCoverSubOpen ? 'rotate-180 text-zinc-300' : ''
                      }`}
                    />
                  </button>

                  {iconCoverSubOpen && (
                    <div className="options-submenu-content">
                      <div
                        className={`widget-menu-item compact ${showCover ? 'selected' : ''}`}
                        onClick={onToggleCover}
                      >
                        <div className="flex items-center gap-2">
                          <Image size={12} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                          <span className="widget-title text-xs font-normal text-zinc-300">
                            Cover Banner
                          </span>
                        </div>
                        <div className={`widget-checkbox ${showCover ? 'checked' : ''}`}>
                          {showCover && <Check size={11} />}
                        </div>
                      </div>

                      <div
                        className={`widget-menu-item compact ${showIcon ? 'selected' : ''}`}
                        onClick={onToggleIcon}
                      >
                        <div className="flex items-center gap-2">
                          <Smile size={12} className="text-zinc-400 shrink-0" />
                          <span className="widget-title text-xs font-normal text-zinc-300">
                            Page Icon
                          </span>
                        </div>
                        <div className={`widget-checkbox ${showIcon ? 'checked' : ''}`}>
                          {showIcon && <Check size={11} />}
                        </div>
                      </div>

                      <div
                        className={`widget-menu-item compact ${showFileName ? 'selected' : ''}`}
                        onClick={onToggleFileName}
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-zinc-400 shrink-0" />
                          <span className="widget-title text-xs font-normal text-zinc-300">
                            File Name
                          </span>
                        </div>
                        <div className={`widget-checkbox ${showFileName ? 'checked' : ''}`}>
                          {showFileName && <Check size={11} />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default React.memo(StatusBar)
