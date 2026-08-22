import React, { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Search,
  Type,
  Copy,
  Files,
  Trash2,
  Maximize2,
  Sliders,
  Lock,
  Unlock,
  Sparkles,
  MessageSquareQuote,
  Languages,
  RotateCcw,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  Check,
  BarChart2,
  Image as ImageIcon,
  Smile,
  FileText,
  FileCode,
  Minus,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Code2,
  Link
} from 'lucide-react'
import { StatusStatsConfig } from '../../../types'

export interface FontOption {
  id: string
  name: string
  family: string
  category: 'sans' | 'serif' | 'mono'
}

const AVAILABLE_FONTS: FontOption[] = [
  // Sans-Serif
  { id: 'inter', name: 'Inter (Default)', family: "'Inter', sans-serif", category: 'sans' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans' },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'sans'
  },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans' },

  // Serif
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: "'Merriweather', 'Georgia', serif",
    category: 'serif'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'serif'
  },
  { id: 'lora', name: 'Lora', family: "'Lora', serif", category: 'serif' },
  {
    id: 'source-serif',
    name: 'Source Serif 4',
    family: "'Source Serif 4', serif",
    category: 'serif'
  },

  // Monospace
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'mono'
  },
  { id: 'fira-code', name: 'Fira Code', family: "'Fira Code', monospace", category: 'mono' },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
    category: 'mono'
  },
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    category: 'mono'
  }
]

const DEFAULT_RECENT_FONTS: FontOption[] = [
  { id: 'inter', name: 'Default', family: "'Inter', sans-serif", category: 'sans' },
  {
    id: 'merriweather',
    name: 'Serif',
    family: "'Merriweather', 'Georgia', serif",
    category: 'serif'
  },
  {
    id: 'jetbrains-mono',
    name: 'Mono',
    family: "'JetBrains Mono', monospace",
    category: 'mono'
  }
]

interface PageActionsMenuProps {
  activeFilePath: string | null
  workspacePath: string | null
  fileContent?: string
  editorFontFamily: string
  onChangeFontFamily: (family: string) => void
  editorFontSize: number
  onChangeFontSize: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (val: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (val: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (val: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (val: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (val: string) => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  onOpenAI?: () => void
  onUndo?: () => void
  onImport?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void

  // Customize page options
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function PageActionsMenu({
  activeFilePath,
  fileContent = '',
  editorFontFamily,
  onChangeFontFamily,
  editorFontSize,
  onChangeFontSize,
  editorLineHeight = '1.7',
  onChangeLineHeight,
  editorLetterSpacing = 'normal',
  onChangeLetterSpacing,
  editorParagraphSpacing = '1.2em',
  onChangeParagraphSpacing,
  editorFontWeight = '400',
  onChangeFontWeight,
  editorTextAlign = 'left',
  onChangeTextAlign,
  isFullScreen = false,
  onToggleFullScreen,
  isPageLocked = false,
  onToggleLockPage,
  onDuplicateFile,
  onDeleteFile,
  onOpenAI,
  onUndo,
  onImport,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink,
  statsConfig,
  onToggleStat,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile
}: PageActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'fonts' | 'customize' | 'textCustomization' | 'export'
  >('main')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('')
  const [copiedContent, setCopiedContent] = useState<boolean>(false)
  const [recentFonts, setRecentFonts] = useState<FontOption[]>(() => {
    try {
      const saved = localStorage.getItem('oink_recent_fonts')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3)
      }
    } catch {
      // ignore
    }
    return DEFAULT_RECENT_FONTS
  })

  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fontSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveSubView('main')
        setSearchQuery('')
        setFontSearchQuery('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (activeSubView === 'main') {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
      }
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, activeSubView])

  useEffect(() => {
    if (activeSubView === 'fonts') {
      setTimeout(() => {
        fontSearchInputRef.current?.focus()
      }, 50)
    }
  }, [activeSubView])

  const selectFont = (font: FontOption): void => {
    onChangeFontFamily(font.family)

    // Update recent fonts list (keep top 3 distinct)
    setRecentFonts((prev) => {
      const filtered = prev.filter((f) => f.family !== font.family)
      const updated = [font, ...filtered].slice(0, 3)
      try {
        localStorage.setItem('oink_recent_fonts', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })

    setActiveSubView('main')
  }

  const handleCopyPageContent = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(fileContent)
      setCopiedContent(true)
      setTimeout(() => setCopiedContent(false), 1800)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  const q = searchQuery.toLowerCase().trim()
  const match = (text: string): boolean => {
    if (!q) return true
    return text.toLowerCase().includes(q)
  }

  const fontQ = fontSearchQuery.toLowerCase().trim()
  const filteredFonts = AVAILABLE_FONTS.filter(
    (f) => !fontQ || f.name.toLowerCase().includes(fontQ) || f.category.includes(fontQ)
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`action-pill-btn more-options-btn ${isOpen ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
          setActiveSubView('main')
        }}
        title="More Actions (Page Options)"
      >
        <MoreHorizontal size={14} className={isOpen ? 'text-zinc-200' : 'text-zinc-300'} />
      </button>

      {isOpen && (
        <div className="page-actions-dropdown-menu" onClick={(e): void => e.stopPropagation()}>
          {/* Submenu 1: Font Chooser View */}
          {activeSubView === 'fonts' && (
            <div className="font-chooser-view">
              <div className="font-chooser-header">
                <button
                  type="button"
                  className="font-chooser-back-btn"
                  onClick={(): void => setActiveSubView('main')}
                  title="Back to options"
                >
                  <ChevronLeft size={14} />
                  <span>Fonts</span>
                </button>
              </div>

              <div className="page-actions-search-wrapper my-1">
                <Search size={13} className="text-zinc-400 shrink-0" />
                <input
                  ref={fontSearchInputRef}
                  type="text"
                  className="page-actions-search-input"
                  placeholder="Filter fonts..."
                  value={fontSearchQuery}
                  onChange={(e): void => setFontSearchQuery(e.target.value)}
                />
              </div>

              <div className="font-chooser-list">
                {filteredFonts.map((f) => {
                  const isSelected =
                    editorFontFamily.toLowerCase().includes(f.id) ||
                    editorFontFamily.toLowerCase().includes(f.name.toLowerCase().split(' ')[0])
                  return (
                    <div
                      key={f.id}
                      className={`font-chooser-item ${isSelected ? 'active' : ''}`}
                      style={{ fontFamily: f.family }}
                      onClick={(): void => selectFont(f)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-chooser-preview text-sm font-medium">Ag</span>
                        <span className="font-chooser-name text-xs">{f.name}</span>
                      </div>
                      {isSelected && <Check size={12} className="text-blue-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submenu 2: Customize Page View (Metrics & Icon & Cover) */}
          {activeSubView === 'customize' && (
            <div className="customize-page-view flex flex-col gap-2">
              <div className="font-chooser-header">
                <button
                  type="button"
                  className="font-chooser-back-btn"
                  onClick={(): void => setActiveSubView('main')}
                  title="Back to options"
                >
                  <ChevronLeft size={14} />
                  <span>Customize page</span>
                </button>
              </div>

              {/* 1. Icon & Cover Section */}
              <div className="options-card-section">
                <div className="options-submenu-header px-2.5 py-1.5 flex items-center gap-2 border-b border-white/5">
                  <ImageIcon size={13} strokeWidth={1.75} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-xs text-zinc-200">Icon & Cover</span>
                </div>

                <div className="p-1 flex flex-col gap-1">
                  {/* Only this file Toggle */}
                  {activeFilePath && onToggleOnlyThisFile && (
                    <>
                      <div
                        className="page-action-row"
                        onClick={onToggleOnlyThisFile}
                        title="When enabled, display overrides are saved to this file's frontmatter"
                      >
                        <div className="page-action-left">
                          <FileCode size={13} className="text-purple-400 shrink-0" />
                          <span className="page-action-title font-medium">Only this file</span>
                        </div>
                        <div className={`page-action-switch ${isOnlyThisFile ? 'active' : ''}`}>
                          <div className="switch-knob" />
                        </div>
                      </div>
                      <div className="page-actions-divider" />
                    </>
                  )}

                  {/* Cover Banner Toggle */}
                  {onToggleCover && (
                    <div className="page-action-row" onClick={onToggleCover}>
                      <div className="page-action-left">
                        <ImageIcon
                          size={13}
                          strokeWidth={1.75}
                          className="text-zinc-400 shrink-0"
                        />
                        <span className="page-action-title">Cover Banner</span>
                      </div>
                      <div className={`page-action-switch ${showCover ? 'active' : ''}`}>
                        <div className="switch-knob" />
                      </div>
                    </div>
                  )}

                  {/* Page Icon Toggle */}
                  {onToggleIcon && (
                    <div className="page-action-row" onClick={onToggleIcon}>
                      <div className="page-action-left">
                        <Smile size={13} className="text-zinc-400 shrink-0" />
                        <span className="page-action-title">Page Icon</span>
                      </div>
                      <div className={`page-action-switch ${showIcon ? 'active' : ''}`}>
                        <div className="switch-knob" />
                      </div>
                    </div>
                  )}

                  {/* File Name Toggle */}
                  {onToggleFileName && (
                    <div className="page-action-row" onClick={onToggleFileName}>
                      <div className="page-action-left">
                        <FileText size={13} className="text-zinc-400 shrink-0" />
                        <span className="page-action-title">File Name</span>
                      </div>
                      <div className={`page-action-switch ${showFileName ? 'active' : ''}`}>
                        <div className="switch-knob" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Metrics Section */}
              {statsConfig && onToggleStat && (
                <div className="options-card-section">
                  <div className="options-submenu-header px-2.5 py-1.5 flex items-center gap-2 border-b border-white/5">
                    <BarChart2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold text-xs text-zinc-200">Metrics</span>
                  </div>

                  <div className="p-1 flex flex-col gap-1">
                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showWords')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Word Count</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showWords ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>

                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showLines')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Line Count</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showLines ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>

                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showSpaces')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Number of Spaces</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showSpaces ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>

                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showChars')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Character Count</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showChars ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>

                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showReadingTime')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Reading Time</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showReadingTime ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>

                    <div
                      className="page-action-row"
                      onClick={(): void => onToggleStat('showSavedBadge')}
                    >
                      <div className="page-action-left">
                        <span className="page-action-title">Floating Saved Badge</span>
                      </div>
                      <div
                        className={`page-action-switch ${statsConfig.showSavedBadge ? 'active' : ''}`}
                      >
                        <div className="switch-knob" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submenu 3: Text Customisation View */}
          {activeSubView === 'textCustomization' && (
            <div className="text-customization-view flex flex-col gap-2.5">
              <div className="font-chooser-header">
                <button
                  type="button"
                  className="font-chooser-back-btn"
                  onClick={(): void => setActiveSubView('main')}
                  title="Back to options"
                >
                  <ChevronLeft size={14} />
                  <span>Text Customisation</span>
                </button>
              </div>

              {/* 1. Font Size Control */}
              <div className="custom-control-group">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                  <span>Font Size</span>
                  <span className="text-zinc-400 font-mono text-xs">{editorFontSize}px</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    className="custom-stepper-btn"
                    onClick={(): void => onChangeFontSize(Math.max(10, editorFontSize - 1))}
                    title="Decrease font size"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {[13, 15, 17, 19].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`custom-pill-btn ${editorFontSize === sz ? 'active' : ''}`}
                        onClick={(): void => onChangeFontSize(sz)}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="custom-stepper-btn"
                    onClick={(): void => onChangeFontSize(Math.min(36, editorFontSize + 1))}
                    title="Increase font size"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                {/* Slider + Numeric input */}
                <div className="custom-slider-num-row">
                  <input
                    type="range"
                    min="10"
                    max="36"
                    step="1"
                    value={editorFontSize}
                    onChange={(e): void => onChangeFontSize(parseInt(e.target.value, 10))}
                    className="custom-range-slider flex-1"
                  />
                  <div className="custom-num-input-wrap">
                    <input
                      type="number"
                      min="10"
                      max="36"
                      step="1"
                      value={editorFontSize}
                      onChange={(e): void => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val >= 10 && val <= 48) {
                          onChangeFontSize(val)
                        }
                      }}
                      className="custom-num-input"
                    />
                    <span className="custom-num-unit">px</span>
                  </div>
                </div>
              </div>

              {/* 2. Line Spacing (Line Height) */}
              {onChangeLineHeight && (
                <div className="custom-control-group">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                    <span>Line Spacing</span>
                    <span className="text-zinc-400 text-[11px]">
                      {editorLineHeight === '1.4'
                        ? 'Compact'
                        : editorLineHeight === '2.0'
                          ? 'Relaxed'
                          : editorLineHeight === '1.7'
                            ? 'Normal'
                            : editorLineHeight}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { val: '1.4', label: 'Compact' },
                      { val: '1.7', label: 'Normal' },
                      { val: '2.0', label: 'Relaxed' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`custom-pill-btn ${editorLineHeight === item.val ? 'active' : ''}`}
                        onClick={(): void => onChangeLineHeight(item.val)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Slider + Numeric input */}
                  <div className="custom-slider-num-row">
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={parseFloat(editorLineHeight) || 1.7}
                      onChange={(e): void => onChangeLineHeight(e.target.value)}
                      className="custom-range-slider flex-1"
                    />
                    <div className="custom-num-input-wrap">
                      <input
                        type="number"
                        min="1.0"
                        max="3.0"
                        step="0.05"
                        value={parseFloat(editorLineHeight) || 1.7}
                        onChange={(e): void => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0.8 && val <= 4.0) {
                            onChangeLineHeight(e.target.value)
                          }
                        }}
                        className="custom-num-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Letter Spacing */}
              {onChangeLetterSpacing && (
                <div className="custom-control-group">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                    <span>Letter Spacing</span>
                    <span className="text-zinc-400 text-[11px]">
                      {editorLetterSpacing === '-0.02em'
                        ? 'Tight'
                        : editorLetterSpacing === '0.04em'
                          ? 'Wide'
                          : editorLetterSpacing === 'normal' || editorLetterSpacing === '0em'
                            ? 'Normal'
                            : editorLetterSpacing}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { val: '-0.02em', label: 'Tight' },
                      { val: 'normal', label: 'Normal' },
                      { val: '0.04em', label: 'Wide' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`custom-pill-btn ${editorLetterSpacing === item.val ? 'active' : ''}`}
                        onClick={(): void => onChangeLetterSpacing(item.val)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Slider + Numeric input */}
                  {(() => {
                    const parsedLetter =
                      editorLetterSpacing === 'normal' ? 0 : parseFloat(editorLetterSpacing) || 0
                    return (
                      <div className="custom-slider-num-row">
                        <input
                          type="range"
                          min="-0.06"
                          max="0.20"
                          step="0.005"
                          value={parsedLetter}
                          onChange={(e): void => onChangeLetterSpacing(`${e.target.value}em`)}
                          className="custom-range-slider flex-1"
                        />
                        <div className="custom-num-input-wrap">
                          <input
                            type="number"
                            min="-0.06"
                            max="0.20"
                            step="0.005"
                            value={parsedLetter}
                            onChange={(e): void => {
                              const val = parseFloat(e.target.value)
                              if (!isNaN(val)) {
                                onChangeLetterSpacing(`${val}em`)
                              }
                            }}
                            className="custom-num-input"
                          />
                          <span className="custom-num-unit">em</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 4. Paragraph Spacing */}
              {onChangeParagraphSpacing && (
                <div className="custom-control-group">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                    <span>Paragraph Spacing</span>
                    <span className="text-zinc-400 text-[11px]">
                      {editorParagraphSpacing === '0.8em'
                        ? 'Compact'
                        : editorParagraphSpacing === '1.8em'
                          ? 'Spacious'
                          : editorParagraphSpacing === '1.2em'
                            ? 'Default'
                            : editorParagraphSpacing}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { val: '0.8em', label: 'Compact' },
                      { val: '1.2em', label: 'Normal' },
                      { val: '1.8em', label: 'Spacious' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`custom-pill-btn ${editorParagraphSpacing === item.val ? 'active' : ''}`}
                        onClick={(): void => onChangeParagraphSpacing(item.val)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Slider + Numeric input */}
                  {(() => {
                    const parsedPara = parseFloat(editorParagraphSpacing) || 1.2
                    return (
                      <div className="custom-slider-num-row">
                        <input
                          type="range"
                          min="0.2"
                          max="3.0"
                          step="0.1"
                          value={parsedPara}
                          onChange={(e): void => onChangeParagraphSpacing(`${e.target.value}em`)}
                          className="custom-range-slider flex-1"
                        />
                        <div className="custom-num-input-wrap">
                          <input
                            type="number"
                            min="0.2"
                            max="3.0"
                            step="0.1"
                            value={parsedPara}
                            onChange={(e): void => {
                              const val = parseFloat(e.target.value)
                              if (!isNaN(val)) {
                                onChangeParagraphSpacing(`${val}em`)
                              }
                            }}
                            className="custom-num-input"
                          />
                          <span className="custom-num-unit">em</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 5. Font Weight */}
              {onChangeFontWeight && (
                <div className="custom-control-group">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                    <span>Font Weight</span>
                    <span className="text-zinc-400 text-[11px]">
                      {editorFontWeight === '300'
                        ? 'Light'
                        : editorFontWeight === '500'
                          ? 'Medium'
                          : editorFontWeight === '600'
                            ? 'Semi-Bold'
                            : editorFontWeight === '700'
                              ? 'Bold'
                              : 'Regular'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[
                      { val: '300', label: 'Light' },
                      { val: '400', label: 'Regular' },
                      { val: '500', label: 'Medium' },
                      { val: '600', label: 'Bold' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`custom-pill-btn ${editorFontWeight === item.val ? 'active' : ''}`}
                        onClick={(): void => onChangeFontWeight(item.val)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Slider + Numeric input */}
                  <div className="custom-slider-num-row">
                    <input
                      type="range"
                      min="200"
                      max="900"
                      step="100"
                      value={parseInt(editorFontWeight, 10) || 400}
                      onChange={(e): void => onChangeFontWeight(e.target.value)}
                      className="custom-range-slider flex-1"
                    />
                    <div className="custom-num-input-wrap">
                      <input
                        type="number"
                        min="200"
                        max="900"
                        step="100"
                        value={parseInt(editorFontWeight, 10) || 400}
                        onChange={(e): void => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val >= 100 && val <= 900) {
                            onChangeFontWeight(val.toString())
                          }
                        }}
                        className="custom-num-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Text Alignment */}
              {onChangeTextAlign && (
                <div className="custom-control-group">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                    <span>Alignment</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 'left', icon: <AlignLeft size={13} />, label: 'Left' },
                      { val: 'center', icon: <AlignCenter size={13} />, label: 'Center' },
                      { val: 'justify', icon: <AlignJustify size={13} />, label: 'Justify' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`custom-pill-btn flex items-center justify-center gap-1.5 ${
                          editorTextAlign === item.val ? 'active' : ''
                        }`}
                        onClick={(): void => onChangeTextAlign(item.val)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submenu 4: Export View */}
          {activeSubView === 'export' && (
            <div className="export-view flex flex-col gap-2">
              <div className="font-chooser-header">
                <button
                  type="button"
                  className="font-chooser-back-btn"
                  onClick={(): void => setActiveSubView('main')}
                  title="Back to options"
                >
                  <ChevronLeft size={14} />
                  <span>Export</span>
                </button>
              </div>

              <div className="options-card-section">
                <div className="p-1 flex flex-col gap-1">
                  {onExportMarkdown && (
                    <div
                      className="page-action-row"
                      onClick={(): void => {
                        onExportMarkdown()
                        setIsOpen(false)
                      }}
                    >
                      <div className="page-action-left">
                        <FileCode size={14} className="text-blue-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="page-action-title">Markdown</span>
                          <span className="text-[10px] text-zinc-500">Export as .md file</span>
                        </div>
                      </div>
                      <Upload size={13} className="text-zinc-500 shrink-0" />
                    </div>
                  )}

                  {onExportHTML && (
                    <div
                      className="page-action-row"
                      onClick={(): void => {
                        onExportHTML()
                        setIsOpen(false)
                      }}
                    >
                      <div className="page-action-left">
                        <Code2 size={14} className="text-amber-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="page-action-title">HTML Webpage</span>
                          <span className="text-[10px] text-zinc-500">Standalone styled .html</span>
                        </div>
                      </div>
                      <Upload size={13} className="text-zinc-500 shrink-0" />
                    </div>
                  )}

                  {onExportText && (
                    <div
                      className="page-action-row"
                      onClick={(): void => {
                        onExportText()
                        setIsOpen(false)
                      }}
                    >
                      <div className="page-action-left">
                        <FileText size={14} className="text-emerald-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="page-action-title">Plain Text</span>
                          <span className="text-[10px] text-zinc-500">Unformatted .txt file</span>
                        </div>
                      </div>
                      <Upload size={13} className="text-zinc-500 shrink-0" />
                    </div>
                  )}

                  {onCopyLink && (
                    <div
                      className="page-action-row"
                      onClick={(): void => {
                        onCopyLink()
                        setCopiedContent(true)
                        setTimeout(() => {
                          setCopiedContent(false)
                          setIsOpen(false)
                        }, 1200)
                      }}
                    >
                      <div className="page-action-left">
                        <Link size={14} className="text-purple-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="page-action-title">
                            {copiedContent ? 'Copied [[Link]]!' : 'Copy Reference Link'}
                          </span>
                          <span className="text-[10px] text-zinc-500">Internal [[Wikilink]]</span>
                        </div>
                      </div>
                      {copiedContent && <Check size={13} className="text-emerald-400 shrink-0" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submenu 0: Main Menu View */}
          {activeSubView === 'main' && (
            <>
              {/* 1. Search Actions Input */}
              <div className="page-actions-search-wrapper">
                <Search size={13} className="text-zinc-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="page-actions-search-input"
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e): void => setSearchQuery(e.target.value)}
                />
              </div>

              {/* 2. Top 3 Recent Font Selector Cards */}
              {!q && (
                <div className="page-actions-font-selector">
                  {recentFonts.map((f, idx) => {
                    const isActive =
                      editorFontFamily.toLowerCase().includes(f.id) ||
                      editorFontFamily.toLowerCase().includes(f.name.toLowerCase().split(' ')[0]) ||
                      (idx === 0 &&
                        !recentFonts.some((rf) => editorFontFamily.toLowerCase().includes(rf.id)))
                    return (
                      <button
                        key={f.id || idx}
                        type="button"
                        className={`font-choice-card ${isActive ? 'active' : ''}`}
                        onClick={(): void => selectFont(f)}
                        title={`Select font: ${f.name}`}
                      >
                        <span className="font-preview" style={{ fontFamily: f.family }}>
                          Ag
                        </span>
                        <span className="font-label truncate max-w-16">{f.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="page-actions-list">
                {/* 'Choose other fonts' dropdown trigger */}
                {match('fonts more fonts typography choose font') && (
                  <div className="page-action-row" onClick={(): void => setActiveSubView('fonts')}>
                    <div className="page-action-left">
                      <Type size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Choose other fonts</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                  </div>
                )}

                {/* Action Item: Copy Page Contents */}
                {match('copy page contents markdown') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      void handleCopyPageContent()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      {copiedContent ? (
                        <Check size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Copy size={14} className="text-zinc-400 shrink-0" />
                      )}
                      <span className="page-action-title">
                        {copiedContent ? 'Copied contents!' : 'Copy page contents'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Item: Duplicate */}
                {match('duplicate clone copy') && onDuplicateFile && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      onDuplicateFile()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Files size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Duplicate</span>
                    </div>
                    <span className="page-action-shortcut">Ctrl+D</span>
                  </div>
                )}

                {/* Action Item: Move to Trash */}
                {match('move to trash delete remove') && onDeleteFile && (
                  <div
                    className="page-action-row danger"
                    onClick={(): void => {
                      onDeleteFile()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Trash2 size={14} className="text-red-400 shrink-0" />
                      <span className="page-action-title text-red-400">Move to Trash</span>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="page-actions-divider" />

                {/* Text Customisation (replaces small text) */}
                {match('text customisation customization font size line height spacing weight') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => setActiveSubView('textCustomization')}
                  >
                    <div className="page-action-left">
                      <Type size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Text Customisation</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                  </div>
                )}

                {/* Toggle: Full screen (Distraction-Free Experience) */}
                {match('full screen distraction free zen mode') && onToggleFullScreen && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      onToggleFullScreen()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Maximize2 size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Full screen</span>
                    </div>
                    <div className={`page-action-switch ${isFullScreen ? 'active' : ''}`}>
                      <div className="switch-knob" />
                    </div>
                  </div>
                )}

                {/* Customize page (Opens Metrics & Icon/Cover Submenu) */}
                {match('customize page options metrics icon cover elements') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => setActiveSubView('customize')}
                  >
                    <div className="page-action-left">
                      <Sliders size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Customize page</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                  </div>
                )}

                {/* Divider */}
                <div className="page-actions-divider" />

                {/* Toggle: Lock page */}
                {match('lock page read only') && onToggleLockPage && (
                  <div className="page-action-row" onClick={onToggleLockPage}>
                    <div className="page-action-left">
                      {isPageLocked ? (
                        <Lock size={14} className="text-amber-400 shrink-0" />
                      ) : (
                        <Unlock size={14} className="text-zinc-400 shrink-0" />
                      )}
                      <span className="page-action-title">Lock page</span>
                    </div>
                    <div className={`page-action-switch ${isPageLocked ? 'active' : ''}`}>
                      <div className="switch-knob" />
                    </div>
                  </div>
                )}

                {/* Action Item: Use with AI */}
                {match('use with ai assistant') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      if (onOpenAI) onOpenAI()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Sparkles size={14} className="text-purple-400 shrink-0" />
                      <span className="page-action-title">Use with AI</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500" />
                  </div>
                )}

                {/* Divider */}
                <div className="page-actions-divider" />

                {/* Action Item: Suggest edits */}
                {match('suggest edits feedback') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      if (onOpenAI) onOpenAI()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <MessageSquareQuote size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Suggest edits</span>
                    </div>
                  </div>
                )}

                {/* Action Item: Translate */}
                {match('translate language') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      if (onOpenAI) onOpenAI()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Languages size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Translate</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500" />
                  </div>
                )}

                {/* Divider */}
                <div className="page-actions-divider" />

                {/* Action Item: Import */}
                {match('import open file upload') && onImport && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      onImport()
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <Download size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Import</span>
                    </div>
                  </div>
                )}

                {/* Action Item: Export */}
                {match('export download html markdown text save as') && (
                  <div className="page-action-row" onClick={(): void => setActiveSubView('export')}>
                    <div className="page-action-left">
                      <Upload size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Export</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                  </div>
                )}

                {/* Action Item: Undo */}
                {match('undo revert') && (
                  <div
                    className="page-action-row"
                    onClick={(): void => {
                      if (onUndo) onUndo()
                      else document.execCommand('undo')
                      setIsOpen(false)
                    }}
                  >
                    <div className="page-action-left">
                      <RotateCcw size={14} className="text-zinc-400 shrink-0" />
                      <span className="page-action-title">Undo</span>
                    </div>
                    <span className="page-action-shortcut">Ctrl+Z</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(PageActionsMenu)
