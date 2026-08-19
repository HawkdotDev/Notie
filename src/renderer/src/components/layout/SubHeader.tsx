import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Network,
  Eye,
  Search,
  Terminal,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Code2,
  Check,
  ListTree,
  PanelLeft
} from 'lucide-react'
import { ViewMode, WidgetState } from '../../types'

interface SubHeaderProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
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
}

function SubHeader({
  sidebarCollapsed,
  onToggleSidebar,
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
  onToggleSearchInput
}: SubHeaderProps): React.JSX.Element {
  const [showWidgetsMenu, setShowWidgetsMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notie_widgets_menu') === 'true'
    } catch {
      return false
    }
  })
  const [showViewMenu, setShowViewMenu] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)

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
    }
    if (showWidgetsMenu || showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWidgetsMenu, showViewMenu])

  return (
    <div className="app-actions-bar relative">
      <div className="actions-bar-left">
        {/* 1. File Editor Tab */}
        <button
          className={`action-pill-btn ${viewMode === 'editor' ? 'active' : ''}`}
          onClick={(): void => {
            if (setViewMode) setViewMode('editor')
            else if (viewMode === 'graph') onToggleViewMode()
          }}
          title="Document Editor View"
        >
          <FileText
            size={13}
            fill="currentColor"
            className={viewMode === 'editor' ? 'text-zinc-300' : ''}
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
            className={`action-pill-btn ${showViewMenu || showRightSidebar ? 'active' : ''}`}
            onClick={(): void => setShowViewMenu((prev) => !prev)}
            title="View Options"
          >
            <Eye size={13} className={showViewMenu || showRightSidebar ? 'text-zinc-300' : ''} />
            <span>View</span>
            <ChevronDown
              size={11}
              className={`transition-transform ${showViewMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showViewMenu && (
            <div className="widgets-dropdown-menu view-dropdown-menu">
              <div className="widgets-dropdown-header">
                <span className="font-semibold text-zinc-300">View Options</span>
              </div>

              <div className="widgets-dropdown-list">
                <div
                  className={`widget-menu-item ${showRightSidebar ? 'selected' : ''}`}
                  onClick={(): void => {
                    onToggleRightSidebar()
                  }}
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

                <div
                  className={`widget-menu-item ${viewMode === 'editor' ? 'selected' : ''}`}
                  onClick={(): void => {
                    if (setViewMode) setViewMode('editor')
                    else if (viewMode === 'graph') onToggleViewMode()
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Document Editor</span>
                      <span className="widget-desc">Standard markdown editor</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${viewMode === 'editor' ? 'checked' : ''}`}>
                    {viewMode === 'editor' && <Check size={11} />}
                  </div>
                </div>

                <div
                  className={`widget-menu-item ${viewMode === 'graph' ? 'selected' : ''}`}
                  onClick={(): void => {
                    if (setViewMode) setViewMode('graph')
                    else if (viewMode === 'editor') onToggleViewMode()
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Network size={13} fill="currentColor" className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Knowledge Graph</span>
                      <span className="widget-desc">Interactive node graph</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${viewMode === 'graph' ? 'checked' : ''}`}>
                    {viewMode === 'graph' && <Check size={11} />}
                  </div>
                </div>

                {onToggleSidebar && (
                  <div
                    className={`widget-menu-item ${!sidebarCollapsed ? 'selected' : ''}`}
                    onClick={onToggleSidebar}
                  >
                    <div className="flex items-center gap-2">
                      <PanelLeft size={13} className="text-zinc-300 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title">File Explorer</span>
                        <span className="widget-desc">Sidebar file navigation</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${!sidebarCollapsed ? 'checked' : ''}`}>
                      {!sidebarCollapsed && <Check size={11} />}
                    </div>
                  </div>
                )}
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

        {/* 5. Terminal Tab */}
        <button
          className={`action-pill-btn ${widgetState.terminal ? 'active' : ''}`}
          onClick={(): void => onToggleWidget('terminal')}
          title="Toggle Quick Terminal"
        >
          <Terminal
            size={13}
            fill="currentColor"
            className={widgetState.terminal ? 'text-zinc-300' : ''}
          />
          <span>Terminal</span>
        </button>

        {/* 6. AI Assistant Tab */}
        <button
          className={`action-pill-btn ${widgetState.assistant ? 'active' : ''}`}
          onClick={(): void => onToggleWidget('assistant')}
          title="Toggle Writing Assistant"
        >
          <Sparkles
            size={13}
            fill="currentColor"
            className={widgetState.assistant ? 'text-zinc-300' : ''}
          />
          <span>Assistant</span>
        </button>
      </div>

      <div className="actions-bar-right relative" ref={menuRef}>
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

        <button
          className="btn-invite"
          onClick={(): void => alert('Invite collaborators feature coming soon!')}
        >
          Invite
        </button>

        <div
          className={`mode-select-pill ${showWidgetsMenu ? 'active' : ''}`}
          onClick={(): void => setShowWidgetsMenu((prev) => !prev)}
          title={`Toggle Floating Widgets (Autosave: ${autoSaveEnabled ? 'ON' : 'OFF'})`}
        >
          <LayoutGrid size={13} fill="currentColor" className="text-zinc-300" />
          <span>Widgets</span>
          {activeUnsaved && <span className="w-1.5 h-1.5 bg-amber-400" />}
          <ChevronDown
            size={12}
            className={`transition-transform ${showWidgetsMenu ? 'rotate-180' : ''}`}
          />
        </div>

        {/* WIDGETS FLOATING DROPDOWN MENU */}
        {showWidgetsMenu && (
          <div className="widgets-dropdown-menu">
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
                  <BarChart2 size={13} fill="currentColor" className="text-emerald-400 shrink-0" />
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
                  <Terminal size={13} fill="currentColor" className="text-blue-400 shrink-0" />
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
                  <Code2 size={13} fill="currentColor" className="text-amber-400 shrink-0" />
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
  )
}

export default React.memo(SubHeader)
