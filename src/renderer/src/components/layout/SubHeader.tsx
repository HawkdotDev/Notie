import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Network,
  ListTree,
  Search,
  Terminal,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Code2,
  Check
} from 'lucide-react'
import { ViewMode } from '../../types'

export interface WidgetState {
  assistant: boolean
  stats: boolean
  terminal: boolean
  snippets: boolean
}

interface SubHeaderProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onSaveActiveFile?: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  setViewMode?: (mode: ViewMode) => void
  onOpenWorkspace?: () => void
  onCreateFileAtRoot?: () => void
  showDiffToggle: boolean
  onToggleDiff: () => void
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  activeUnsaved: boolean
  widgetState: WidgetState
  onToggleWidget: (widgetId: keyof WidgetState) => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  showSearchInput?: boolean
  onToggleSearchInput?: () => void
}

function SubHeader({
  viewMode,
  onToggleViewMode,
  setViewMode,
  showDiffToggle,
  onToggleDiff,
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
  const menuRef = useRef<HTMLDivElement>(null)

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
    }
    if (showWidgetsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWidgetsMenu])

  const activeWidgetCount = Object.values(widgetState).filter(Boolean).length

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
            className={viewMode === 'editor' ? 'text-zinc-200' : ''}
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
            className={viewMode === 'graph' ? 'text-zinc-200' : ''}
          />
          <span>Graph</span>
        </button>

        {/* 3. Document Outline Tab */}
        <button
          className={`action-pill-btn ${showRightSidebar ? 'active' : ''}`}
          onClick={onToggleRightSidebar}
          title="Toggle Document Outline"
        >
          <ListTree size={13} className={showRightSidebar ? 'text-zinc-200' : ''} />
          <span>Outline</span>
        </button>

        {/* 4. Global Search Tab */}
        {onToggleSearchInput && (
          <button
            className={`action-pill-btn ${showSearchInput ? 'active' : ''}`}
            onClick={onToggleSearchInput}
            title="Toggle File Search"
          >
            <Search size={13} className={showSearchInput ? 'text-zinc-200' : ''} />
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
            className={widgetState.terminal ? 'text-zinc-200' : ''}
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
            className={widgetState.assistant ? 'text-zinc-200' : ''}
          />
          <span>Assistant</span>
        </button>
      </div>

      <div className="actions-bar-right relative" ref={menuRef}>
        <div className="header-toggle-group">
          <span>Show difference</span>
          <div className={`toggle-switch ${showDiffToggle ? 'active' : ''}`} onClick={onToggleDiff}>
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
          <span>Widgets ({activeWidgetCount})</span>
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
              <span className="font-semibold text-zinc-200">Floating Widgets</span>
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
