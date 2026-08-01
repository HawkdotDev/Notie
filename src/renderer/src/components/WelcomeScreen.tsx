import React from 'react'
import electronLogo from '../assets/electron.svg'

interface WelcomeScreenProps {
  workspacePath: string | null
}

export default function WelcomeScreen({ workspacePath }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="welcome-workspace">
      <div className="flex flex-col items-center mb-3">
        <img
          src={electronLogo}
          className="w-14 h-14 mb-2 opacity-95 hover:scale-105 transition-transform"
          alt="Notie Logo"
        />
        <div className="welcome-logo">Notie</div>
      </div>
      <div className="welcome-tagline">A beautiful workspace</div>
      <div className="welcome-shortcuts">
        <div className="shortcut-row">
          <span>Open Folder</span>
          <span className="shortcut-key">Ctrl + O</span>
        </div>
        {workspacePath && (
          <div className="shortcut-row">
            <span>Create File</span>
            <span className="shortcut-key">Ctrl + N</span>
          </div>
        )}
        <div className="shortcut-row">
          <span>Save File</span>
          <span className="shortcut-key">Ctrl + S</span>
        </div>
      </div>
    </div>
  )
}
