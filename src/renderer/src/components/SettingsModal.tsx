import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  Sliders,
  Type,
  Palette,
  FolderCog,
  Bot,
  Keyboard,
  Info,
  Check,
  RotateCcw,
  Blocks
} from 'lucide-react'
import PluginsWidget from './layout/PluginsWidget'
import oinkLogo from '../assets/oink.png'

interface UserSettings {
  // General
  autoSaveEnabled: boolean
  autoSaveDelay: number
  restoreTabsOnStartup: boolean
  confirmDelete: boolean

  // Editor
  fontFamily: 'sans' | 'mono' | 'serif'
  fontSize: number
  lineHeight: 'compact' | 'normal' | 'relaxed'
  tabSize: number
  wordWrap: boolean
  spellcheck: boolean

  // Appearance
  editorWidth: 'compact' | 'standard' | 'wide' | 'full'
  coverBannerHeight: number
  showBreadcrumbs: boolean
  showStatusBar: boolean

  // Files & Explorer
  showHiddenFiles: boolean
  excludePatterns: string

  // AI & Diagnostics
  aiAutoAnalyze: boolean
  aiModelProvider: 'local' | 'gemini' | 'custom'
  geminiApiKey: string
  checkGrammar: boolean
  checkStyle: boolean
  checkPassiveVoice: boolean
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  autoSaveEnabled: true,
  autoSaveDelay: 2,
  restoreTabsOnStartup: true,
  confirmDelete: true,

  fontFamily: 'sans',
  fontSize: 15,
  lineHeight: 'normal',
  tabSize: 2,
  wordWrap: true,
  spellcheck: true,

  editorWidth: 'standard',
  coverBannerHeight: 200,
  showBreadcrumbs: true,
  showStatusBar: true,

  showHiddenFiles: false,
  excludePatterns: 'node_modules, .git, dist, out, .DS_Store',

  aiAutoAnalyze: true,
  aiModelProvider: 'local',
  geminiApiKey: '',
  checkGrammar: true,
  checkStyle: true,
  checkPassiveVoice: true
}

const SETTINGS_STORAGE_KEY = 'oink_user_preferences_v1'

const FONT_OPTIONS = [
  { label: 'Inter (Modern Sans)', value: "'Inter', sans-serif" },
  { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: 'Georgia (Classic Serif)', value: "'Georgia', serif" },
  { label: 'Merriweather (Editorial Serif)', value: "'Merriweather', serif" },
  { label: 'Lora (Literary Serif)', value: "'Lora', serif" },
  { label: 'JetBrains Mono (Code Monospace)', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code (Ligatures Monospace)', value: "'Fira Code', monospace" }
]

function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_USER_SETTINGS
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange?: (settings: UserSettings) => void
  currentAutoSave?: boolean
  onToggleAutoSave?: () => void
  editorFontFamily?: string
  editorFontSize?: number
  onFontFamilyChange?: (font: string) => void
  onFontSizeChange?: (size: number) => void
  initialTab?: SettingsTab
  enabledPlugins?: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
}

type SettingsTab =
  | 'general'
  | 'editor'
  | 'appearance'
  | 'files'
  | 'plugins'
  | 'ai'
  | 'shortcuts'
  | 'about'

interface ShortcutItem {
  keyCombo: string
  description: string
  category: string
}

const SHORTCUT_LIST: ShortcutItem[] = [
  { keyCombo: 'Ctrl + S', description: 'Save current document', category: 'General' },
  { keyCombo: 'Ctrl + P', description: 'Quick search files / explorer', category: 'Navigation' },
  { keyCombo: 'Ctrl + B', description: 'Toggle explorer sidebar', category: 'Layout' },
  { keyCombo: 'Ctrl + ,', description: 'Open Settings & Preferences', category: 'General' },
  { keyCombo: 'Ctrl + Shift + G', description: 'Toggle Knowledge Graph view', category: 'View' },
  { keyCombo: 'Ctrl + Shift + A', description: 'Toggle AI Assistant panel', category: 'Layout' },
  { keyCombo: 'Ctrl + `', description: 'Toggle Quick Terminal widget', category: 'Widgets' },
  { keyCombo: 'Ctrl + Shift + N', description: 'Create new markdown document', category: 'Files' },
  { keyCombo: 'Ctrl + Shift + D', description: 'Toggle Diff preview mode', category: 'Editor' },
  { keyCombo: 'Ctrl + W', description: 'Close active tab', category: 'Tabs' },
  { keyCombo: 'Ctrl + Tab', description: 'Switch to next open tab', category: 'Tabs' },
  { keyCombo: 'Esc', description: 'Close popovers / modals / search', category: 'General' }
]

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
  currentAutoSave,
  onToggleAutoSave,
  editorFontFamily = "'Inter', sans-serif",
  editorFontSize = 15,
  onFontFamilyChange,
  onFontSizeChange,
  initialTab,
  enabledPlugins = {},
  onTogglePlugin
}: SettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'general')
  const [prevInitialTab, setPrevInitialTab] = useState<SettingsTab | undefined>(initialTab)
  const [searchQuery, setSearchQuery] = useState<string>('')

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = getStoredSettings()
    if (currentAutoSave !== undefined) {
      stored.autoSaveEnabled = currentAutoSave
    }
    return stored
  })
  const [saveToast, setSaveToast] = useState<boolean>(false)

  // Save settings helper
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]): void => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage quota exceptions
      }
      if (onSettingsChange) onSettingsChange(next)
      if (key === 'autoSaveEnabled' && onToggleAutoSave && value !== currentAutoSave) {
        onToggleAutoSave()
      }
      return next
    })

    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 1500)
  }

  const handleResetDefaults = (): void => {
    if (window.confirm('Reset all preferences to default values?')) {
      setSettings(DEFAULT_USER_SETTINGS)
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_USER_SETTINGS))
      if (onSettingsChange) onSettingsChange(DEFAULT_USER_SETTINGS)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 1500)
    }
  }

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUT_LIST
    const q = searchQuery.toLowerCase()
    return SHORTCUT_LIST.filter(
      (s) =>
        s.keyCombo.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-dialog" onClick={(e): void => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="settings-modal-header">
          <div className="flex items-center gap-3">
            <div className="settings-header-icon-box">
              <Sliders size={14} className="text-zinc-300" />
            </div>
            <div>
              <h2 className="settings-title">Preferences & Settings</h2>
              <p className="settings-subtitle">Customize editor, behavior, themes, and shortcuts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveToast && (
              <div className="settings-save-toast">
                <Check size={11} className="text-emerald-400" />
                <span>Saved</span>
              </div>
            )}

            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              title="Close Settings (Esc)"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Search Filter Header */}
        <div className="settings-search-bar">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            className="settings-search-input"
            placeholder="Search settings, options, or shortcuts..."
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="settings-search-clear"
              onClick={(): void => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Main Body (Left Sidebar Nav + Right Options Pane) */}
        <div className="settings-modal-body">
          {/* Left Navigation Tabs */}
          <div className="settings-sidebar-nav">
            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('general')}
            >
              <Sliders size={13} />
              <span>General</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('editor')}
            >
              <Type size={13} />
              <span>Editor & Text</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('appearance')}
            >
              <Palette size={13} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('files')}
            >
              <FolderCog size={13} />
              <span>Files & Explorer</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'plugins' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('plugins')}
            >
              <Blocks size={13} className="text-zinc-400" />
              <span>Plugins & Extensions</span>
              {Object.values(enabledPlugins).filter(Boolean).length > 0 && (
                <span className="text-[10px] ml-auto px-1.5 py-0.2 bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  {Object.values(enabledPlugins).filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('ai')}
            >
              <Bot size={13} />
              <span>AI & Analysis</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('shortcuts')}
            >
              <Keyboard size={13} />
              <span>Shortcuts</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('about')}
            >
              <Info size={13} />
              <span>About & System</span>
            </button>

            <div className="mt-auto pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                className="settings-reset-btn"
                onClick={handleResetDefaults}
                title="Reset all settings to factory defaults"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="settings-content-pane">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>General Preferences</h3>
                  <p>Configure document saving, recovery, and confirmation dialogs</p>
                </div>

                <div className="settings-card">
                  {/* Autosave Toggle */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Automatic Save</label>
                      <span className="settings-row-desc">
                        Automatically write modified documents to disk after editing
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.autoSaveEnabled}
                        onChange={(e): void => updateSetting('autoSaveEnabled', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Autosave Delay */}
                  {settings.autoSaveEnabled && (
                    <div className="settings-row border-t border-zinc-800/60 pt-3">
                      <div className="settings-row-text">
                        <label className="settings-row-label">Autosave Delay</label>
                        <span className="settings-row-desc">
                          Interval of inactivity before saving changes
                        </span>
                      </div>
                      <select
                        className="settings-select"
                        value={settings.autoSaveDelay}
                        onChange={(e): void =>
                          updateSetting('autoSaveDelay', Number(e.target.value))
                        }
                      >
                        <option value={1}>1 second (Instant)</option>
                        <option value={2}>2 seconds (Default)</option>
                        <option value={5}>5 seconds</option>
                        <option value={10}>10 seconds</option>
                      </select>
                    </div>
                  )}

                  {/* Restore Tabs on Startup */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Restore Tabs on Startup</label>
                      <span className="settings-row-desc">
                        Reopen all previously open documents when launching Oink
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.restoreTabsOnStartup}
                        onChange={(e): void =>
                          updateSetting('restoreTabsOnStartup', e.target.checked)
                        }
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Confirm Delete */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Confirm File Deletion</label>
                      <span className="settings-row-desc">
                        Prompt confirmation before permanently removing files or folders
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.confirmDelete}
                        onChange={(e): void => updateSetting('confirmDelete', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. EDITOR & TEXT TAB */}
            {activeTab === 'editor' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Editor & Typography</h3>
                  <p>Customize fonts, text scaling, line height, and editing behaviors</p>
                </div>

                <div className="settings-card">
                  {/* Font Family */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Font Family</label>
                      <span className="settings-row-desc">
                        Typeface used across documents and markdown content
                      </span>
                    </div>
                    <select
                      className="settings-select"
                      value={editorFontFamily}
                      onChange={(e): void => {
                        const val = e.target.value
                        onFontFamilyChange?.(val)
                        const category = val.includes('monospace')
                          ? 'mono'
                          : val.includes('serif') && !val.includes('sans-serif')
                            ? 'serif'
                            : 'sans'
                        updateSetting('fontFamily', category as 'sans' | 'mono' | 'serif')
                      }}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option
                          key={font.value}
                          value={font.value}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Font Size</label>
                      <span className="settings-row-desc">
                        Base font size for document editor ({editorFontSize}px)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={24}
                        step={1}
                        className="settings-range"
                        value={editorFontSize}
                        onChange={(e): void => {
                          const size = Number(e.target.value)
                          onFontSizeChange?.(size)
                          updateSetting('fontSize', size)
                        }}
                      />
                      <span className="text-xs font-mono text-zinc-300 w-8 text-right">
                        {editorFontSize}px
                      </span>
                    </div>
                  </div>

                  {/* Typography Live Preview */}
                  <div className="border-t border-zinc-800/60 pt-3 px-1">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 block">
                      Live Typography Preview
                    </span>
                    <div
                      className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-none text-zinc-200"
                      style={{
                        fontFamily: editorFontFamily,
                        fontSize: `${editorFontSize}px`,
                        lineHeight: 1.6
                      }}
                    >
                      The quick brown fox jumps over the lazy dog. 1234567890 — [[Wikilinks]] and
                      #headings render smoothly.
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Line Spacing</label>
                      <span className="settings-row-desc">
                        Vertical line height for reading comfort
                      </span>
                    </div>
                    <div className="settings-segment-group">
                      {(['compact', 'normal', 'relaxed'] as const).map((lh) => (
                        <button
                          key={lh}
                          type="button"
                          className={`settings-segment-btn ${settings.lineHeight === lh ? 'active' : ''}`}
                          onClick={(): void => updateSetting('lineHeight', lh)}
                        >
                          {lh.charAt(0).toUpperCase() + lh.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Size */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Tab Indentation</label>
                      <span className="settings-row-desc">Spaces inserted on Tab press</span>
                    </div>
                    <select
                      className="settings-select"
                      value={settings.tabSize}
                      onChange={(e): void => updateSetting('tabSize', Number(e.target.value))}
                    >
                      <option value={2}>2 Spaces</option>
                      <option value={4}>4 Spaces</option>
                    </select>
                  </div>

                  {/* Word Wrap */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Soft Word Wrap</label>
                      <span className="settings-row-desc">
                        Wrap long text lines within the editor window width
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.wordWrap}
                        onChange={(e): void => updateSetting('wordWrap', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Spellcheck */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Browser Spellcheck</label>
                      <span className="settings-row-desc">
                        Enable native spellcheck and dictionary suggestions
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.spellcheck}
                        onChange={(e): void => updateSetting('spellcheck', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Appearance & Layout</h3>
                  <p>Configure workspace bounds, cover height, and visual dock elements</p>
                </div>

                <div className="settings-card">
                  {/* Editor Max Width */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Editor Container Width</label>
                      <span className="settings-row-desc">
                        Horizontal boundary for document content
                      </span>
                    </div>
                    <select
                      className="settings-select"
                      value={settings.editorWidth}
                      onChange={(e): void =>
                        updateSetting(
                          'editorWidth',
                          e.target.value as 'compact' | 'standard' | 'wide' | 'full'
                        )
                      }
                    >
                      <option value="compact">Compact (750px)</option>
                      <option value="standard">Standard (850px)</option>
                      <option value="wide">Wide (1050px)</option>
                      <option value="full">Full Window Width</option>
                    </select>
                  </div>

                  {/* Banner Cover Height */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Cover Banner Height</label>
                      <span className="settings-row-desc">
                        Default height of Notion-style banner headers ({settings.coverBannerHeight}
                        px)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={140}
                        max={320}
                        step={20}
                        className="settings-range"
                        value={settings.coverBannerHeight}
                        onChange={(e): void =>
                          updateSetting('coverBannerHeight', Number(e.target.value))
                        }
                      />
                      <span className="text-xs font-mono text-zinc-300 w-12 text-right">
                        {settings.coverBannerHeight}px
                      </span>
                    </div>
                  </div>

                  {/* Show Breadcrumbs Navigation */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Show Breadcrumb Bar</label>
                      <span className="settings-row-desc">
                        Display minimal navigation path in sub-header
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showBreadcrumbs}
                        onChange={(e): void => updateSetting('showBreadcrumbs', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Show Status Bar */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Show Bottom Status Strip</label>
                      <span className="settings-row-desc">
                        Display the 2-part bottom status bar with file info and word stats
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showStatusBar}
                        onChange={(e): void => updateSetting('showStatusBar', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FILES & EXPLORER TAB */}
            {activeTab === 'files' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Files & Explorer Settings</h3>
                  <p>Configure file exclusion patterns and directory tree filtering</p>
                </div>

                <div className="settings-card">
                  {/* Show Hidden Files */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Show Dot / Hidden Files</label>
                      <span className="settings-row-desc">
                        Display files starting with a dot (e.g. .env, .gitignore) in explorer
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showHiddenFiles}
                        onChange={(e): void => updateSetting('showHiddenFiles', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Exclusion Patterns */}
                  <div className="border-t border-zinc-800/60 pt-3">
                    <div className="mb-2">
                      <label className="settings-row-label">Excluded Directories & Patterns</label>
                      <span className="settings-row-desc block mt-0.5">
                        Comma-separated folder names to ignore during background indexing
                      </span>
                    </div>
                    <input
                      type="text"
                      className="settings-input w-full"
                      value={settings.excludePatterns}
                      onChange={(e): void => updateSetting('excludePatterns', e.target.value)}
                      placeholder="node_modules, .git, dist, out"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. PLUGINS & EXTENSIONS TAB */}
            {activeTab === 'plugins' && (
              <div className="settings-section h-130 flex flex-col">
                <div className="settings-section-header shrink-0">
                  <h3>Extensions & Community Plugins</h3>
                  <p>
                    Extend Oink with LaTeX formulas, daily notes, diagrams, code execution, and
                    tools
                  </p>
                </div>

                <div className="flex-1 overflow-hidden border border-zinc-800/80 bg-zinc-950/40">
                  <PluginsWidget
                    enabledPlugins={enabledPlugins}
                    onTogglePlugin={onTogglePlugin || ((): void => {})}
                  />
                </div>
              </div>
            )}

            {/* 6. AI & ANALYSIS TAB */}
            {activeTab === 'ai' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>AI Assistant & Document Diagnostics</h3>
                  <p>Configure automated writing analysis, grammar rules, and AI endpoints</p>
                </div>

                <div className="settings-card">
                  {/* Automatic AI Analysis */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Automated Document Analysis</label>
                      <span className="settings-row-desc">
                        Scan document text continuously for style improvements and clarity
                      </span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.aiAutoAnalyze}
                        onChange={(e): void => updateSetting('aiAutoAnalyze', e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* AI Provider */}
                  <div className="settings-row border-t border-zinc-800/60 pt-3">
                    <div className="settings-row-text">
                      <label className="settings-row-label">AI Engine Provider</label>
                      <span className="settings-row-desc">
                        Select engine for document summarization and rewrite suggestions
                      </span>
                    </div>
                    <select
                      className="settings-select"
                      value={settings.aiModelProvider}
                      onChange={(e): void =>
                        updateSetting(
                          'aiModelProvider',
                          e.target.value as 'local' | 'gemini' | 'custom'
                        )
                      }
                    >
                      <option value="local">Local Heuristic Engine (Fast, Offline)</option>
                      <option value="gemini">Google Gemini AI (Cloud API)</option>
                      <option value="custom">Custom OpenAI / Ollama Endpoint</option>
                    </select>
                  </div>

                  {/* Gemini API Key */}
                  {settings.aiModelProvider === 'gemini' && (
                    <div className="border-t border-zinc-800/60 pt-3">
                      <div className="mb-2">
                        <label className="settings-row-label">Gemini API Key</label>
                        <span className="settings-row-desc block mt-0.5">
                          Personal API key for Gemini 1.5 Pro / Flash models
                        </span>
                      </div>
                      <input
                        type="password"
                        className="settings-input w-full"
                        value={settings.geminiApiKey}
                        onChange={(e): void => updateSetting('geminiApiKey', e.target.value)}
                        placeholder="AIzaSy..."
                      />
                    </div>
                  )}

                  {/* Diagnostic Checkers */}
                  <div className="border-t border-zinc-800/60 pt-3">
                    <span className="settings-row-label block mb-2">Active Diagnostic Rules</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkGrammar}
                          onChange={(e): void => updateSetting('checkGrammar', e.target.checked)}
                        />
                        <span>Grammar & Typo</span>
                      </label>

                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkStyle}
                          onChange={(e): void => updateSetting('checkStyle', e.target.checked)}
                        />
                        <span>Style & Wordiness</span>
                      </label>

                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkPassiveVoice}
                          onChange={(e): void =>
                            updateSetting('checkPassiveVoice', e.target.checked)
                          }
                        />
                        <span>Passive Voice</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. KEYBOARD SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Keyboard Shortcuts</h3>
                  <p>Standard keybindings for navigation, editing, and window control</p>
                </div>

                <div className="settings-card p-0 overflow-hidden">
                  <div className="settings-shortcuts-table">
                    <div className="settings-shortcuts-thead">
                      <span>Action / Command</span>
                      <span>Category</span>
                      <span className="text-right">Keybinding</span>
                    </div>

                    <div className="settings-shortcuts-tbody">
                      {filteredShortcuts.map((item) => (
                        <div key={item.keyCombo} className="settings-shortcut-row">
                          <span className="settings-shortcut-desc">{item.description}</span>
                          <span className="settings-shortcut-cat">{item.category}</span>
                          <div className="settings-shortcut-keys">
                            {item.keyCombo.split('+').map((k, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="text-zinc-600 text-xs">+</span>}
                                <kbd className="settings-kbd">{k.trim()}</kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}

                      {filteredShortcuts.length === 0 && (
                        <div className="text-center py-6 text-xs text-zinc-500">
                          No shortcuts match &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>About Oink</h3>
                  <p>Application specifications and environment diagnostics</p>
                </div>

                <div className="settings-card">
                  <div className="flex items-center gap-4 pb-4 border-b border-zinc-800/80">
                    <img
                      src={oinkLogo}
                      alt="Oink Logo"
                      className="w-12 h-12 object-contain rounded p-1 bg-zinc-900 border border-zinc-700"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-300">Oink Markdown IDE</h4>
                      <p className="text-xs text-zinc-400">
                        Version 0.1.0 • Hybrid Brutalist &amp; Notion-Style Architecture
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                    <div className="settings-info-item">
                      <span className="text-zinc-500">Platform:</span>
                      <span className="text-zinc-300 font-mono">Windows x64 / Electron</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500">Rendering Engine:</span>
                      <span className="text-zinc-300 font-mono">React 19 + TypeScript</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500">Graph Visualizer:</span>
                      <span className="text-zinc-300 font-mono">2D Force Graph (Canvas)</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500">Web Worker Indexer:</span>
                      <span className="text-zinc-300 font-mono">Active (Multithreaded)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status */}
        <div className="settings-modal-footer">
          <span className="text-zinc-500 text-xs">
            Press <kbd className="settings-kbd text-[10px]">Esc</kbd> to close preferences
          </span>
          <button type="button" className="settings-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
