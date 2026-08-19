import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Check,
  BarChart2,
  Sliders,
  Layers,
  Clock,
  Type,
  Sparkles
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
  const [activeDropdown, setActiveDropdown] = useState<
    'metrics' | 'preferences' | 'extensions' | null
  >(null)
  const [metricsSub1Open, setMetricsSub1Open] = useState(true)
  const [metricsSub2Open, setMetricsSub2Open] = useState(false)
  const [prefSub1Open, setPrefSub1Open] = useState(true)
  const [prefSub2Open, setPrefSub2Open] = useState(false)
  const [extSub1Open, setExtSub1Open] = useState(true)
  const [extSub2Open, setExtSub2Open] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

      {/* 3. Floating Tool Dropdowns in Top-Right Corner (One after the other) */}
      <div ref={containerRef} className="floating-editor-tools-topright">
        {/* Dropdown 1: Metrics Options */}
        {onToggleStat && (
          <div className="floating-tool-item">
            <button
              type="button"
              className={`floating-metrics-topright-trigger ${activeDropdown === 'metrics' ? 'active' : ''}`}
              onClick={(): void =>
                setActiveDropdown((prev) => (prev === 'metrics' ? null : 'metrics'))
              }
              title="Metrics"
            >
              <SlidersHorizontal size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
            </button>

            {activeDropdown === 'metrics' && (
              <div className="floating-metrics-topright-menu">
                <div className="floating-metrics-topright-header">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={12} className="text-emerald-400" />
                    <span className="font-semibold text-zinc-300">Metrics</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Options</span>
                </div>

                <div className="floating-metrics-topright-list">
                  {/* Metrics Sub-dropdown 1: Visible Metrics */}
                  <div className="options-submenu-group">
                    <button
                      type="button"
                      className={`options-submenu-trigger ${metricsSub1Open ? 'expanded' : ''}`}
                      onClick={(): void => setMetricsSub1Open((p) => !p)}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 size={13} className="text-emerald-400 shrink-0" />
                        <span className="widget-title">Visible Counters</span>
                      </div>
                      <ChevronDown
                        size={11}
                        className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                          metricsSub1Open ? 'rotate-180 text-zinc-300' : ''
                        }`}
                      />
                    </button>

                    {metricsSub1Open && (
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

                  {/* Metrics Sub-dropdown 2: Reading Targets */}
                  <div className="options-submenu-group">
                    <button
                      type="button"
                      className={`options-submenu-trigger ${metricsSub2Open ? 'expanded' : ''}`}
                      onClick={(): void => setMetricsSub2Open((p) => !p)}
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-amber-400 shrink-0" />
                        <span className="widget-title">Reading Speed</span>
                      </div>
                      <ChevronDown
                        size={11}
                        className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                          metricsSub2Open ? 'rotate-180 text-zinc-300' : ''
                        }`}
                      />
                    </button>

                    {metricsSub2Open && (
                      <div className="options-submenu-content">
                        <div className="options-empty-content">
                          <span>Standard 200 words / min</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dropdown 2: Editor Preferences */}
        <div className="floating-tool-item">
          <button
            type="button"
            className={`floating-metrics-topright-trigger ${activeDropdown === 'preferences' ? 'active' : ''}`}
            onClick={(): void =>
              setActiveDropdown((prev) => (prev === 'preferences' ? null : 'preferences'))
            }
            title="Editor Preferences"
          >
            <Sliders size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
          </button>

          {activeDropdown === 'preferences' && (
            <div className="floating-metrics-topright-menu">
              <div className="floating-metrics-topright-header">
                <div className="flex items-center gap-1.5">
                  <Sliders size={12} className="text-blue-400" />
                  <span className="font-semibold text-zinc-300">Preferences</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Editor</span>
              </div>

              <div className="floating-metrics-topright-list">
                {/* Preferences Sub-dropdown 1: Formatting */}
                <div className="options-submenu-group">
                  <button
                    type="button"
                    className={`options-submenu-trigger ${prefSub1Open ? 'expanded' : ''}`}
                    onClick={(): void => setPrefSub1Open((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders size={13} className="text-blue-400 shrink-0" />
                      <span className="widget-title">Formatting</span>
                    </div>
                    <ChevronDown
                      size={11}
                      className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                        prefSub1Open ? 'rotate-180 text-zinc-300' : ''
                      }`}
                    />
                  </button>

                  {prefSub1Open && (
                    <div className="options-submenu-content">
                      <div className="options-empty-content">
                        <span>No formatting options available</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preferences Sub-dropdown 2: Typography */}
                <div className="options-submenu-group">
                  <button
                    type="button"
                    className={`options-submenu-trigger ${prefSub2Open ? 'expanded' : ''}`}
                    onClick={(): void => setPrefSub2Open((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <Type size={13} className="text-cyan-400 shrink-0" />
                      <span className="widget-title">Typography</span>
                    </div>
                    <ChevronDown
                      size={11}
                      className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                        prefSub2Open ? 'rotate-180 text-zinc-300' : ''
                      }`}
                    />
                  </button>

                  {prefSub2Open && (
                    <div className="options-submenu-content">
                      <div className="options-empty-content">
                        <span>Default font configuration</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown 3: Extensions */}
        <div className="floating-tool-item">
          <button
            type="button"
            className={`floating-metrics-topright-trigger ${activeDropdown === 'extensions' ? 'active' : ''}`}
            onClick={(): void =>
              setActiveDropdown((prev) => (prev === 'extensions' ? null : 'extensions'))
            }
            title="Extensions"
          >
            <Layers size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
          </button>

          {activeDropdown === 'extensions' && (
            <div className="floating-metrics-topright-menu">
              <div className="floating-metrics-topright-header">
                <div className="flex items-center gap-1.5">
                  <Layers size={12} className="text-purple-400" />
                  <span className="font-semibold text-zinc-300">Extensions</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Plugins</span>
              </div>

              <div className="floating-metrics-topright-list">
                {/* Extensions Sub-dropdown 1: Plugins */}
                <div className="options-submenu-group">
                  <button
                    type="button"
                    className={`options-submenu-trigger ${extSub1Open ? 'expanded' : ''}`}
                    onClick={(): void => setExtSub1Open((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-purple-400 shrink-0" />
                      <span className="widget-title">Installed Plugins</span>
                    </div>
                    <ChevronDown
                      size={11}
                      className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                        extSub1Open ? 'rotate-180 text-zinc-300' : ''
                      }`}
                    />
                  </button>

                  {extSub1Open && (
                    <div className="options-submenu-content">
                      <div className="options-empty-content">
                        <span>No plugins installed</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extensions Sub-dropdown 2: Community Tools */}
                <div className="options-submenu-group">
                  <button
                    type="button"
                    className={`options-submenu-trigger ${extSub2Open ? 'expanded' : ''}`}
                    onClick={(): void => setExtSub2Open((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-amber-400 shrink-0" />
                      <span className="widget-title">Community Tools</span>
                    </div>
                    <ChevronDown
                      size={11}
                      className={`text-zinc-500 transition-transform duration-150 shrink-0 ${
                        extSub2Open ? 'rotate-180 text-zinc-300' : ''
                      }`}
                    />
                  </button>

                  {extSub2Open && (
                    <div className="options-submenu-content">
                      <div className="options-empty-content">
                        <span>No tools enabled</span>
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
