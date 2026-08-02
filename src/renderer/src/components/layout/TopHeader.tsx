import React from 'react'
import { Folder, ChevronRight, Minus, Square, X, Bell, Settings } from 'lucide-react'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'
import iconSvg from '../../assets/icon.svg'

interface TopHeaderProps {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  fileIcons?: Record<string, string>
  onOpenSettings?: () => void
}

function TopHeader({
  workspacePath,
  workspaceName,
  activeFilePath,
  fileIcons,
  onOpenSettings
}: TopHeaderProps): React.JSX.Element {
  const relativeParts = React.useMemo(() => {
    if (!activeFilePath) return []
    const rel = activeFilePath.replace(workspacePath || '', '').replace(/^[\\/]/, '')
    return rel ? rel.split(/[\\/]/) : []
  }, [activeFilePath, workspacePath])

  const customIcon = React.useMemo(() => {
    if (!activeFilePath || !fileIcons || !workspacePath) return undefined
    const rel = activeFilePath
      .toLowerCase()
      .replace(workspacePath.toLowerCase(), '')
      .replace(/^[\\/]/, '')
    return fileIcons[rel]
  }, [activeFilePath, fileIcons, workspacePath])

  return (
    <div className="app-top-header" onDoubleClick={(): void => window.api.window.maximize()}>
      <div className="top-header-left">
        <div className="flex items-center gap-2 select-none shrink-0">
          <img src={iconSvg} className="w-4 h-4 object-contain" alt="Notie Logo" />
          <span className="app-title-logo">Notie</span>
        </div>

        {/* Vertical Pipe Separator */}
        {activeFilePath && <div className="header-pipe-separator" />}

        {/* Styled Breadcrumb Path Navigation */}
        {activeFilePath && (
          <div className="nav-breadcrumbs">
            <div className="breadcrumb-item workspace-root" title={`Workspace: ${workspaceName}`}>
              <Folder size={12} fill="currentColor" className="text-purple-400 shrink-0" />
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
                      customIcon ? (
                        <span className="text-xs mr-0.5">{customIcon}</span>
                      ) : (
                        <ProfessionalFileIcon fileName={part} className="scale-75" />
                      )
                    ) : (
                      <Folder size={12} fill="currentColor" className="text-zinc-500 shrink-0" />
                    )}
                    <span>{part}</span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Header Action Icons & Window Controls */}
      <div className="top-header-right flex items-center gap-2">
        {/* Notifications Icon Button */}
        <button
          className="header-action-btn relative"
          onClick={(): void => alert('Notifications: All workspace systems operational.')}
          title="Notifications"
        >
          <Bell size={13} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
        </button>

        {/* Settings Icon Button */}
        <button
          className="header-action-btn"
          onClick={(): void => (onOpenSettings ? onOpenSettings() : alert('Settings Menu'))}
          title="Settings"
        >
          <Settings size={13} />
        </button>

        {/* User Profile Avatar */}
        <button
          className="header-user-avatar"
          onClick={(): void => alert('User Profile: Notie Account')}
          title="Profile (Notie User)"
        >
          <span>DN</span>
        </button>

        {/* Vertical Divider */}
        <div className="h-3 w-px bg-zinc-700/60 mx-0.5" />

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="window-controls">
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.minimize()}
            title="Minimize Window"
          >
            <Minus size={13} />
          </button>
          <button
            className="window-control-btn"
            onClick={(): void => window.api.window.maximize()}
            title="Maximize / Restore Window"
          >
            <Square size={11} />
          </button>
          <button
            className="window-control-btn close-btn"
            onClick={(): void => window.api.window.close()}
            title="Close Application"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TopHeader)
