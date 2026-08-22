import React, { useState, useRef, useEffect } from 'react'
import { LayoutGrid, ChevronDown, Sparkles, BarChart2, Terminal, Code2, Check } from 'lucide-react'
import { WidgetState } from '../../../types'

interface WidgetsMenuProps {
  widgetState: WidgetState
  onToggleWidget: (widget: keyof WidgetState) => void
  activeUnsaved: boolean
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
}

function WidgetsMenu({
  widgetState,
  onToggleWidget,
  activeUnsaved,
  autoSaveEnabled,
  onToggleAutoSave
}: WidgetsMenuProps): React.JSX.Element {
  const [showWidgetsMenu, setShowWidgetsMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('oink_widgets_menu') === 'true'
    } catch {
      return false
    }
  })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('oink_widgets_menu', String(showWidgetsMenu))
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
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWidgetsMenu])

  return (
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
        <LayoutGrid size={13} className={showWidgetsMenu ? 'text-zinc-200' : 'text-zinc-400'} />
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
  )
}

export default React.memo(WidgetsMenu)
