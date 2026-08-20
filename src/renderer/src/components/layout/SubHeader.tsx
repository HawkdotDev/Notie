import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Network,
  Eye,
  Search,
  Blocks,
  Terminal,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Code2,
  Check,
  ListTree,
  Layers,
  Share2,
  Copy,
  Users,
  Download
} from 'lucide-react'
import { ViewMode, WidgetState } from '../../types'

interface SubHeaderProps {
  onSaveActiveFile?: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  setViewMode?: (mode: ViewMode) => void
  onOpenWorkspace?: () => void
  onCreateFileAtRoot?: () => void
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  activeUnsaved: boolean
  widgetState: WidgetState
  onToggleWidget: (widget: keyof WidgetState) => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  showSearchInput?: boolean
  onToggleSearchInput?: () => void
  showTabs?: boolean
  onToggleTabs?: () => void
  sidebarView?: 'explorer' | 'plugins'
  sidebarCollapsed?: boolean
  onTogglePluginsView?: () => void
  onSwitchToFiles?: () => void
  enabledPluginsCount?: number
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
}

function SubHeader({
  viewMode,
  onToggleViewMode,
  setViewMode,
  autoSaveEnabled,
  onToggleAutoSave,
  activeUnsaved,
  widgetState,
  onToggleWidget,
  showRightSidebar,
  onToggleRightSidebar,
  showSearchInput,
  onToggleSearchInput,
  showTabs = true,
  onToggleTabs,
  sidebarView = 'explorer',
  sidebarCollapsed = false,
  onTogglePluginsView,
  onSwitchToFiles,
  enabledPluginsCount = 0,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink
}: SubHeaderProps): React.JSX.Element {
  const [showWidgetsMenu, setShowWidgetsMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notie_widgets_menu') === 'true'
    } catch {
      return false
    }
  })
  const [showViewMenu, setShowViewMenu] = useState<boolean>(false)
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false)
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('notie_widgets_menu', String(showWidgetsMenu))
    } catch {
      // ignore
    }
  }, [showWidgetsMenu])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowWidgetsMenu(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false)
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    if (showWidgetsMenu || showViewMenu || showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWidgetsMenu, showViewMenu, showShareMenu])

  return (
    <div className="app-actions-bar relative">
      <div className="actions-bar-left">
        {/* 1. File Editor Tab */}
        <button
          className={`action-pill-btn ${viewMode === 'editor' && (sidebarView === 'explorer' || sidebarCollapsed) ? 'active' : ''}`}
          onClick={(): void => {
            if (onSwitchToFiles) onSwitchToFiles()
            if (setViewMode) setViewMode('editor')
            else if (viewMode === 'graph') onToggleViewMode()
          }}
          title="Document Editor & File View"
        >
          <FileText
            size={13}
            fill="currentColor"
            className={
              viewMode === 'editor' && (sidebarView === 'explorer' || sidebarCollapsed)
                ? 'text-zinc-300'
                : ''
            }
          />
          <span>File</span>
        </button>

        {/* 2. Knowledge Graph Tab */}
        <button
          className={`action-pill-btn ${viewMode === 'graph' ? 'active' : ''}`}
          onClick={(): void => {
            if (setViewMode) setViewMode('graph')
            else if (viewMode === 'editor') onToggleViewMode()
          }}
          title="Knowledge Graph View"
        >
          <Network
            size={13}
            fill="currentColor"
            className={viewMode === 'graph' ? 'text-zinc-300' : ''}
          />
          <span>Graph</span>
        </button>

        {/* 3. Document View Dropdown */}
        <div className="relative" ref={viewMenuRef}>
          <button
            type="button"
            className={`action-pill-btn ${showViewMenu ? 'active' : ''}`}
            onClick={(e): void => {
              e.stopPropagation()
              setShowViewMenu((prev) => !prev)
            }}
            title="View Options & Typography"
          >
            <Eye size={13} className={showViewMenu ? 'text-zinc-200' : ''} />
            <span>View</span>
            <ChevronDown
              size={11}
              className={`transition-transform duration-150 ${showViewMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showViewMenu && (
            <div className="widgets-dropdown-menu view-dropdown-menu">
              <div className="widgets-dropdown-header">
                <span className="font-semibold text-zinc-300">View & Layout</span>
              </div>

              <div className="widgets-dropdown-list">
                {/* 1. Toggle Tabs */}
                {onToggleTabs && (
                  <div
                    className={`widget-menu-item ${showTabs ? 'selected' : ''}`}
                    onClick={onToggleTabs}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-zinc-300 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title">Editor Tabs</span>
                        <span className="widget-desc">Show open document tabs</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${showTabs ? 'checked' : ''}`}>
                      {showTabs && <Check size={11} />}
                    </div>
                  </div>
                )}

                {/* 2. Toggle Document Outline */}
                <div
                  className={`widget-menu-item ${showRightSidebar ? 'selected' : ''}`}
                  onClick={onToggleRightSidebar}
                >
                  <div className="flex items-center gap-2">
                    <ListTree size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Document Outline</span>
                      <span className="widget-desc">Sidebar table of contents</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${showRightSidebar ? 'checked' : ''}`}>
                    {showRightSidebar && <Check size={11} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Global Search Tab */}
        {onToggleSearchInput && (
          <button
            className={`action-pill-btn ${showSearchInput ? 'active' : ''}`}
            onClick={onToggleSearchInput}
            title="Toggle File Search"
          >
            <Search size={13} className={showSearchInput ? 'text-zinc-300' : ''} />
            <span>Search</span>
          </button>
        )}

        {/* 5. Plugins Button */}
        {onTogglePluginsView && (
          <button
            className={`action-pill-btn ${sidebarView === 'plugins' && !sidebarCollapsed ? 'active' : ''}`}
            onClick={onTogglePluginsView}
            title="Toggle Plugins & Extensions (replaces File View)"
          >
            <Blocks
              size={13}
              className={sidebarView === 'plugins' && !sidebarCollapsed ? 'text-zinc-200' : ''}
            />
            <span>Plugins</span>
            {enabledPluginsCount !== undefined && enabledPluginsCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                {enabledPluginsCount}
              </span>
            )}
          </button>
        )}

        {/* 6. Widgets Menu Tab */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={`action-pill-btn ${showWidgetsMenu ? 'active' : ''}`}
            onClick={(e): void => {
              e.stopPropagation()
              setShowWidgetsMenu((prev) => !prev)
            }}
            title="Toggle Floating Widgets"
          >
            <LayoutGrid
              size={13}
              fill="currentColor"
              className={showWidgetsMenu ? 'text-zinc-200' : 'text-zinc-300'}
            />
            <span>Widgets</span>
            {activeUnsaved && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
            <ChevronDown
              size={11}
              className={`transition-transform duration-150 ${showWidgetsMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* WIDGETS FLOATING DROPDOWN MENU */}
          {showWidgetsMenu && (
            <div className="widgets-dropdown-menu view-dropdown-menu">
              <div className="widgets-dropdown-header">
                <span className="font-semibold text-zinc-300">Floating Widgets</span>
                <button
                  className="text-[10px] text-zinc-300 bg-zinc-800 px-1.5 py-0.5 border border-zinc-700 hover:bg-zinc-700 cursor-pointer transition-colors"
                  onClick={onToggleAutoSave}
                  title="Click to toggle Autosave"
                >
                  Autosave: {autoSaveEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="widgets-dropdown-list">
                <div
                  className={`widget-menu-item ${widgetState.assistant ? 'selected' : ''}`}
                  onClick={(): void => onToggleWidget('assistant')}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Writing Assistant</span>
                      <span className="widget-desc">Grammarly style error fixes</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${widgetState.assistant ? 'checked' : ''}`}>
                    {widgetState.assistant && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item ${widgetState.stats ? 'selected' : ''}`}
                  onClick={(): void => onToggleWidget('stats')}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Document Stats</span>
                      <span className="widget-desc">Word count, TOC outline</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${widgetState.stats ? 'checked' : ''}`}>
                    {widgetState.stats && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item ${widgetState.terminal ? 'selected' : ''}`}
                  onClick={(): void => onToggleWidget('terminal')}
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Quick Terminal</span>
                      <span className="widget-desc">Python & console output</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${widgetState.terminal ? 'checked' : ''}`}>
                    {widgetState.terminal && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item ${widgetState.snippets ? 'selected' : ''}`}
                  onClick={(): void => onToggleWidget('snippets')}
                >
                  <div className="flex items-center gap-2">
                    <Code2 size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Code Snippets</span>
                      <span className="widget-desc">Quick insert templates</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${widgetState.snippets ? 'checked' : ''}`}>
                    {widgetState.snippets && <Check size={11} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="actions-bar-right flex items-center gap-2">
        {/* Share & Export Dropdown Button beside Autosave */}
        <div className="relative" ref={shareMenuRef}>
          <button
            type="button"
            className={`action-pill-btn ${showShareMenu ? 'active' : ''}`}
            onClick={(e): void => {
              e.stopPropagation()
              setShowShareMenu((prev) => !prev)
            }}
            title="Share & Export Document"
          >
            <Share2 size={12} strokeWidth={1.75} className="shrink-0 text-zinc-300" />
            <span>Share</span>
            <ChevronDown
              size={11}
              className={`transition-transform duration-150 ${showShareMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showShareMenu && (
            <div className="share-dropdown-menu">
              {/* Collaboration Section */}
              <div className="share-dropdown-section">
                <span className="share-section-title">Collaboration</span>
                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    if (onCopyLink) {
                      onCopyLink()
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                    }
                    setCopyFeedback(true)
                    setTimeout(() => setCopyFeedback(false), 1500)
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {copyFeedback ? (
                      <Check size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Copy size={13} className="text-zinc-400 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="share-item-title">
                        {copyFeedback ? 'Copied to Clipboard!' : 'Copy Reference Link'}
                      </span>
                      <span className="share-item-desc">Wikilink or internal document link</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    alert('Invite collaborators feature coming soon!')
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={13} className="text-zinc-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Invite Collaborators</span>
                      <span className="share-item-desc">Add team members to this workspace</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="share-dropdown-divider" />

              {/* Export Section */}
              <div className="share-dropdown-section">
                <span className="share-section-title">Export Document</span>
                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportHTML?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as HTML</span>
                      <span className="share-item-desc">Formatted standalone HTML file</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportText?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as Plain Text</span>
                      <span className="share-item-desc">Clean .txt file without formatting</span>
                    </div>
                  </div>
                </div>

                <div
                  className="share-dropdown-item"
                  onClick={(): void => {
                    setShowShareMenu(false)
                    onExportMarkdown?.()
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Download size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="share-item-title">Export as Markdown</span>
                      <span className="share-item-desc">Raw Markdown syntax file</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Autosave Toggle */}
        <div
          className="header-toggle-group cursor-pointer"
          onClick={onToggleAutoSave}
          title={`Autosave is ${autoSaveEnabled ? 'Enabled' : 'Disabled'}`}
        >
          <span>Autosave</span>
          <div className={`toggle-switch ${autoSaveEnabled ? 'active' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SubHeader)
