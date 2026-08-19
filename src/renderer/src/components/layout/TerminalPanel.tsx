import React from 'react'
import { Plus, Square, Trash2, ChevronUp, X } from 'lucide-react'
import { TerminalTabType } from '../../types'

interface TerminalPanelProps {
  showTerminalPanel: boolean
  terminalTab: TerminalTabType
  onSelectTab: (tab: TerminalTabType) => void
  onCloseTerminal: () => void
}

export default function TerminalPanel({
  showTerminalPanel,
  terminalTab,
  onSelectTab,
  onCloseTerminal
}: TerminalPanelProps): React.JSX.Element | null {
  if (!showTerminalPanel) return null

  return (
    <div className="bottom-terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <span
            className={`terminal-tab ${terminalTab === 'PROBLEMS' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('PROBLEMS')}
          >
            PROBLEMS 16
          </span>
          <span
            className={`terminal-tab ${terminalTab === 'OUTPUT' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('OUTPUT')}
          >
            OUTPUT
          </span>
          <span
            className={`terminal-tab ${terminalTab === 'TERMINAL' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('TERMINAL')}
          >
            TERMINAL
          </span>
          <span
            className={`terminal-tab ${terminalTab === 'DEBUG CONSOLE' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('DEBUG CONSOLE')}
          >
            DEBUG CONSOLE
          </span>
        </div>

        <div className="terminal-controls">
          <span>1: Node</span>
          <Plus size={12} className="cursor-pointer hover:text-zinc-200" />
          <Square size={10} className="cursor-pointer hover:text-zinc-200" />
          <Trash2 size={12} className="cursor-pointer hover:text-zinc-200" />
          <ChevronUp size={12} className="cursor-pointer hover:text-zinc-200" />
          <X size={13} className="cursor-pointer hover:text-red-400" onClick={onCloseTerminal} />
        </div>
      </div>

      <div className="terminal-content">
        <div>
          <span className="terminal-timestamp">[Jul 28 2028, 23:11:30]</span> Python 3.8.5 (default)
          [GCC 9.3.0] on linux
        </div>
        <div>
          <span className="terminal-timestamp">[Jul 28 2028, 23:11:30]</span> Type &quot;help&quot;
          for more information. &gt;&gt;&gt;
        </div>
      </div>
    </div>
  )
}
