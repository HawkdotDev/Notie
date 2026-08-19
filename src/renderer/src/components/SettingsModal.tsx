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
  RotateCcw
} from 'lucide-react'

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

const SETTINGS_STORAGE_KEY = 'notie_user_preferences_v1'

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
}

type SettingsTab = 'general' | 'editor' | 'appearance' | 'files' | 'ai' | 'shortcuts' | 'about'

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
  onToggleAutoSave
}: SettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [searchQuery, setSearchQuery] = useState<string>('')
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
      } catch (err) {
        console.warn('Failed to save settings:', err)
      }
      if (onSettingsChange) onSettingsChange(next)
      if (key === 'autoSaveEnabled' && onToggleAutoSave && value !== currentAutoSave) {
        onToggleAutoSave()
      }
      return next
    })

    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 1200)
  }

  const handleResetDefaults = (): void => {
    if (window.confirm('Reset all preferences to default values?')) {
      setSettings(DEFAULT_USER_SETTINGS)
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_USER_SETTINGS))
      if (onSettingsChange) onSettingsChange(DEFAULT_USER_SETTINGS)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 1200)
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
        {/* Minimal Integrated Header */}
        <div className="settings-modal-header">
          <div className="flex items-center gap-2">
            <Sliders size={13} strokeWidth={1.5} className="text-zinc-400" />
            <span className="settings-title">Settings</span>
          </div>

          {/* Integrated Search Bar */}
          <div className="settings-header-search">
            <Search size={12} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              className="settings-header-search-input"
              placeholder="Filter settings..."
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
                <X size={11} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <div className="settings-save-toast">
                <Check size={10} strokeWidth={2} className="text-emerald-400" />
                <span>Saved</span>
              </div>
            )}

            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
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
              <Sliders size={12} strokeWidth={1.5} />
              <span>General</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('editor')}
            >
              <Type size={12} strokeWidth={1.5} />
              <span>Editor</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('appearance')}
            >
              <Palette size={12} strokeWidth={1.5} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('files')}
            >
              <FolderCog size={12} strokeWidth={1.5} />
              <span>Files</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('ai')}
            >
              <Bot size={12} strokeWidth={1.5} />
              <span>AI</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('shortcuts')}
            >
              <Keyboard size={12} strokeWidth={1.5} />
              <span>Shortcuts</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={(): void => setActiveTab('about')}
            >
              <Info size={12} strokeWidth={1.5} />
              <span>About</span>
            </button>

            <div className="mt-auto pt-3 border-t border-zinc-800/50">
              <button
                type="button"
                className="settings-reset-btn"
                onClick={handleResetDefaults}
                title="Reset all settings to defaults"
              >
                <RotateCcw size={11} strokeWidth={1.5} />
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
                  <h3>General</h3>
                  <p>Document persistence and safety</p>
                </div>

                <div className="settings-card">
                  {/* Autosave Toggle */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Automatic Save</label>
                      <span className="settings-row-desc">
                        Save modified documents automatically
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
                    <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                      <div className="settings-row-text">
                        <label className="settings-row-label">Save Delay</label>
                        <span className="settings-row-desc">Inactivity interval before saving</span>
                      </div>
                      <select
                        className="settings-select"
                        value={settings.autoSaveDelay}
                        onChange={(e): void =>
                          updateSetting('autoSaveDelay', Number(e.target.value))
                        }
                      >
                        <option value={1}>1s (Instant)</option>
                        <option value={2}>2s (Default)</option>
                        <option value={5}>5s</option>
                      </select>
                    </div>
                  )}

                  {/* Restore Tabs on Startup */}
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Restore Open Tabs</label>
                      <span className="settings-row-desc">Reopen active tabs upon launch</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Confirm Deletion</label>
                      <span className="settings-row-desc">
                        Prompt before deleting files or folders
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

            {/* 2. EDITOR TAB */}
            {activeTab === 'editor' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Editor</h3>
                  <p>Typography and editing parameters</p>
                </div>

                <div className="settings-card">
                  {/* Font Family */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Font Family</label>
                      <span className="settings-row-desc">Primary editor typeface</span>
                    </div>
                    <select
                      className="settings-select"
                      value={settings.fontFamily}
                      onChange={(e): void =>
                        updateSetting('fontFamily', e.target.value as 'sans' | 'mono' | 'serif')
                      }
                    >
                      <option value="sans">Sans (Inter)</option>
                      <option value="mono">Mono (JetBrains Mono)</option>
                      <option value="serif">Serif (Georgia)</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Font Size</label>
                      <span className="settings-row-desc">Base paragraph scale</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        min={12}
                        max={18}
                        step={1}
                        className="settings-range"
                        value={settings.fontSize}
                        onChange={(e): void => updateSetting('fontSize', Number(e.target.value))}
                      />
                      <span className="text-[11px] font-mono text-zinc-400 w-7 text-right">
                        {settings.fontSize}px
                      </span>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Line Spacing</label>
                      <span className="settings-row-desc">Vertical line height</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Tab Size</label>
                      <span className="settings-row-desc">Indentation spaces</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Word Wrap</label>
                      <span className="settings-row-desc">Wrap lines to container width</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Spellcheck</label>
                      <span className="settings-row-desc">Native dictionary checking</span>
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
                  <h3>Appearance</h3>
                  <p>Layout dimensions and dock elements</p>
                </div>

                <div className="settings-card">
                  {/* Editor Max Width */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Content Width</label>
                      <span className="settings-row-desc">Editor reading boundary</span>
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
                      <option value="full">Full Width</option>
                    </select>
                  </div>

                  {/* Banner Cover Height */}
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Cover Height</label>
                      <span className="settings-row-desc">Banner header height</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        min={140}
                        max={300}
                        step={20}
                        className="settings-range"
                        value={settings.coverBannerHeight}
                        onChange={(e): void =>
                          updateSetting('coverBannerHeight', Number(e.target.value))
                        }
                      />
                      <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                        {settings.coverBannerHeight}px
                      </span>
                    </div>
                  </div>

                  {/* Show Breadcrumbs Navigation */}
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Breadcrumbs Bar</label>
                      <span className="settings-row-desc">Show sub-header path</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Bottom Status Bar</label>
                      <span className="settings-row-desc">Show 2-part footer bar</span>
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

            {/* 4. FILES TAB */}
            {activeTab === 'files' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Files</h3>
                  <p>Explorer and indexing patterns</p>
                </div>

                <div className="settings-card">
                  {/* Show Hidden Files */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Dot Files</label>
                      <span className="settings-row-desc">Show hidden dot files</span>
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
                  <div className="border-t border-zinc-800/40 pt-2.5">
                    <div className="mb-1.5">
                      <label className="settings-row-label">Exclude Patterns</label>
                      <span className="settings-row-desc block">
                        Ignored folders during background index
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

            {/* 5. AI TAB */}
            {activeTab === 'ai' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>AI</h3>
                  <p>Writing diagnostics and providers</p>
                </div>

                <div className="settings-card">
                  {/* Automatic AI Analysis */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Auto Diagnostics</label>
                      <span className="settings-row-desc">Scan active text continuously</span>
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
                  <div className="settings-row border-t border-zinc-800/40 pt-2.5">
                    <div className="settings-row-text">
                      <label className="settings-row-label">Engine Provider</label>
                      <span className="settings-row-desc">Diagnostic suggestions provider</span>
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
                      <option value="local">Local (Offline)</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="custom">Custom Endpoint</option>
                    </select>
                  </div>

                  {/* Gemini API Key */}
                  {settings.aiModelProvider === 'gemini' && (
                    <div className="border-t border-zinc-800/40 pt-2.5">
                      <div className="mb-1.5">
                        <label className="settings-row-label">API Key</label>
                        <span className="settings-row-desc block">Personal Gemini API key</span>
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
                  <div className="border-t border-zinc-800/40 pt-2.5">
                    <span className="settings-row-label block mb-2">Active Rules</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkGrammar}
                          onChange={(e): void => updateSetting('checkGrammar', e.target.checked)}
                        />
                        <span>Grammar</span>
                      </label>

                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkStyle}
                          onChange={(e): void => updateSetting('checkStyle', e.target.checked)}
                        />
                        <span>Style</span>
                      </label>

                      <label className="settings-checkbox-card">
                        <input
                          type="checkbox"
                          checked={settings.checkPassiveVoice}
                          onChange={(e): void =>
                            updateSetting('checkPassiveVoice', e.target.checked)
                          }
                        />
                        <span>Passive</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Shortcuts</h3>
                  <p>Keyboard keybindings</p>
                </div>

                <div className="settings-card p-0 overflow-hidden">
                  <div className="settings-shortcuts-table">
                    <div className="settings-shortcuts-thead">
                      <span>Command</span>
                      <span>Category</span>
                      <span className="text-right">Key</span>
                    </div>

                    <div className="settings-shortcuts-tbody">
                      {filteredShortcuts.map((item) => (
                        <div key={item.keyCombo} className="settings-shortcut-row">
                          <span className="settings-shortcut-desc">{item.description}</span>
                          <span className="settings-shortcut-cat">{item.category}</span>
                          <div className="settings-shortcut-keys">
                            {item.keyCombo.split('+').map((k, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="text-zinc-600 text-[10px]">+</span>}
                                <kbd className="settings-kbd">{k.trim()}</kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}

                      {filteredShortcuts.length === 0 && (
                        <div className="text-center py-6 text-[11px] text-zinc-500">
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
                  <h3>About</h3>
                  <p>Environment diagnostics</p>
                </div>

                <div className="settings-card">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/50">
                    <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-xs text-white">
                      N
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Notie Markdown IDE</h4>
                      <p className="text-[10px] text-zinc-500">Version 0.1.0 • Hybrid IDE</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 text-[11px]">
                    <div className="settings-info-item">
                      <span className="text-zinc-500 text-[10px]">Platform</span>
                      <span className="text-zinc-300 font-mono text-[11px]">
                        Windows / Electron
                      </span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500 text-[10px]">Renderer</span>
                      <span className="text-zinc-300 font-mono text-[11px]">
                        React 19 + TypeScript
                      </span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500 text-[10px]">Graph</span>
                      <span className="text-zinc-300 font-mono text-[11px]">2D Force Graph</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-zinc-500 text-[10px]">Indexer</span>
                      <span className="text-zinc-300 font-mono text-[11px]">Worker (Active)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="settings-modal-footer">
          <span className="text-zinc-500 text-[10px]">
            Press <kbd className="settings-kbd text-[9px]">Esc</kbd> to close
          </span>
          <button type="button" className="settings-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
