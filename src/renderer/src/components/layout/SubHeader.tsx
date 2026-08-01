import React from 'react'
import {
  Bug,
  Zap,
  Languages,
  FileText,
  Code,
  Code2,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { ViewMode } from '../../types'

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
}

export default function SubHeader({
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
  activeUnsaved
}: SubHeaderProps): React.JSX.Element {
  return (
    <div className="app-actions-bar">
      <div className="actions-bar-left">
        <button
          className="action-pill-btn home-btn"
          title="Toggle Sidebar"
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
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

      <div className="actions-bar-right">
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
          className="mode-select-pill"
          onClick={onToggleAutoSave}
          title={`Autosave: ${autoSaveEnabled ? 'ON' : 'OFF'} (Click to toggle)`}
        >
          <Code2 size={13} className="text-purple-400" />
          <span>Python</span>
          {activeUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <ChevronDown size={12} />
        </div>
      </div>
    </div>
  )
}
