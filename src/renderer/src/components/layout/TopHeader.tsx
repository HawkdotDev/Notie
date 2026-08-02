import React from 'react'
import {
  Bell,
  Settings,
  User,
  Minus,
  Square,
  X,
  Folder,
  ChevronRight,
  FileText,
  Terminal,
  Globe
} from 'lucide-react'
import electronLogo from '../../assets/electron.svg'

interface TopHeaderProps {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
}

export default function TopHeader({
  workspacePath,
  workspaceName,
  activeFilePath
}: TopHeaderProps): React.JSX.Element {
  const relativeParts = React.useMemo(() => {
    if (!activeFilePath) return []
    const rel = activeFilePath.replace(workspacePath || '', '').replace(/^[\\/]/, '')
    return rel ? rel.split(/[\\/]/) : []
  }, [activeFilePath, workspacePath])

  const getFileIcon = (fileName: string): React.JSX.Element => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (ext === 'py') return <Terminal size={12} className="text-purple-400 shrink-0" />
    if (ext === 'html') return <Globe size={12} className="text-orange-400 shrink-0" />
    if (ext === 'css') return <span className="file-badge css scale-75">#</span>
    if (ext === 'js' || ext === 'ts') return <span className="file-badge js scale-75">{ext}</span>
    return <FileText size={12} className="text-zinc-400 shrink-0" />
  }

  return (
    <div className="app-top-header">
      <div className="top-header-left">
        <div className="flex items-center gap-2 select-none shrink-0">
          <img src={electronLogo} className="w-4 h-4 object-contain" alt="Notie Logo" />
          <span className="app-title-logo">Notie</span>
        </div>

        {/* Vertical Pipe Separator */}
        {activeFilePath && <div className="header-pipe-separator" />}

        {/* Styled Breadcrumb Path Navigation */}
        {activeFilePath && (
          <div className="nav-breadcrumbs">
            <div className="breadcrumb-item workspace-root" title={`Workspace: ${workspaceName}`}>
              <Folder size={12} className="text-purple-400 shrink-0" />
              <span>{workspaceName}</span>
            </div>

            {relativeParts.map((part, idx) => {
              const isLast = idx === relativeParts.length - 1
              return (
                <React.Fragment key={idx}>
                  <ChevronRight size={12} className="breadcrumb-chevron" />
                  <div
                    className={`breadcrumb-item ${isLast ? 'active-file' : 'directory'}`}
                    title={part}
                  >
                    {isLast ? (
                      getFileIcon(part)
                    ) : (
                      <Folder size={12} className="text-zinc-500 shrink-0" />
                    )}
                    <span>{part}</span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      <div className="top-header-right">
        <button className="header-icon-btn" title="Notifications">
          <Bell size={13} />
        </button>
        <button className="header-icon-btn" title="Settings">
          <Settings size={13} />
        </button>
        <div className="avatar-badge" title="User Profile">
          <User size={12} />
        </div>

        {/* Standard window controls fallback */}
        <div className="window-controls">
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.minimize()}
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.maximize()}
            title="Maximize"
          >
            <Square size={10} />
          </button>
          <button
            className="window-control-btn close-btn"
            onClick={(): void => window.api.window.close()}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
