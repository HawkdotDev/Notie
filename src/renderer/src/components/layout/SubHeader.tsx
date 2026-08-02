import React, { useState, useRef, useEffect } from 'react'
import {
  Bug,
  Zap,
  Languages,
  FileText,
  Code,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  BarChart2,
  Terminal,
  Code2,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react'
import { ViewMode } from '../../types'

export interface WidgetState {
  assistant: boolean
  stats: boolean
  terminal: boolean
  snippets: boolean
}

interface SubHeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onSaveActiveFile: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  onOpenWorkspace: () => void
  onCreateFileAtRoot: () => void
  showDiffToggle: boolean
  onToggleDiff: () => void
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  activeUnsaved: boolean
  widgetState: WidgetState
  onToggleWidget: (widgetId: keyof WidgetState) => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
}

function SubHeader({
  sidebarCollapsed,
  onToggleSidebar,
  onSaveActiveFile,
  onToggleViewMode,
  onOpenWorkspace,
  onCreateFileAtRoot,
  showDiffToggle,
  onToggleDiff,
  autoSaveEnabled,
  onToggleAutoSave,
  activeUnsaved,
  widgetState,
  onToggleWidget,
  showRightSidebar,
  onToggleRightSidebar
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

  // Close menu when clicking outside
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
        <button
          className="action-pill-btn home-btn"
          title={sidebarCollapsed ? 'Open Explorer Sidebar' : 'Collapse Explorer Sidebar'}
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
        <button
          className="action-pill-btn"
          onClick={(): void => alert('Debug feature coming soon!')}
        >
          <Bug size={13} />
          <span>Debug</span>
        </button>
        <button className="action-pill-btn" onClick={onSaveActiveFile}>
          <Zap size={13} />
          <span>Optimize</span>
        </button>
        <button className="action-pill-btn" onClick={onToggleViewMode}>
          <Languages size={13} />
          <span>Translate</span>
        </button>

        <button className="action-pill-btn" onClick={onOpenWorkspace}>
          <FileText size={13} />
          <span>Documentation</span>
        </button>
        <button className="action-pill-btn" onClick={onCreateFileAtRoot}>
          <Code size={13} />
          <span>Generate code</span>
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
          <LayoutGrid size={13} fill="currentColor" className="text-purple-400" />
          <span>Widgets ({activeWidgetCount})</span>
          {activeUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
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
                className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer transition-colors"
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
                  <Sparkles size={13} fill="currentColor" className="text-purple-400 shrink-0" />
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

        <button
          className={`action-pill-btn ${showRightSidebar ? 'active' : ''}`}
          onClick={onToggleRightSidebar}
          title={showRightSidebar ? 'Close Right Sidebar' : 'Open Right Sidebar'}
        >
          {showRightSidebar ? (
            <PanelRightClose size={13} className="text-purple-400" />
          ) : (
            <PanelRightOpen size={13} />
          )}
        </button>
      </div>
    </div>
  )
}

export default React.memo(SubHeader)
