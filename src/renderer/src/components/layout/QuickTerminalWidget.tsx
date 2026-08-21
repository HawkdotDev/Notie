import React, { useState } from 'react'
import { Terminal as TerminalIcon, Play, Trash2, CheckCircle2 } from 'lucide-react'

export default function QuickTerminalWidget(): React.JSX.Element {
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Mink Desktop Engine v2.4 initialized',
    '[PYTHON] 3.8.5 runtime connected (default)',
    '[WIDGETS] 4 floating widget windows active',
    '[GRAMMAR] Grammarly diagnostic scanner online: 0 critical errors'
  ])
  const [inputVal, setInputVal] = useState<string>('')

  const handleRunCommand = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!inputVal.trim()) return
    const cmd = inputVal.trim()
    setLogs((prev) => [...prev, `> ${cmd}`, `Executed '${cmd}' successfully.`])
    setInputVal('')
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3 font-mono text-xs overflow-hidden bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold">
          <TerminalIcon size={12} className="text-zinc-300" />
          <span>Console & Python Output</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 size={10} />
            <span>Ready</span>
          </span>
          <button
            className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors"
            onClick={(): void => setLogs([])}
            title="Clear Logs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-zinc-300 pr-1">
        {logs.map((log, i) => (
          <div
            key={i}
            className={
              log.startsWith('>')
                ? 'text-zinc-300 font-semibold'
                : log.includes('ERROR')
                  ? 'text-red-400'
                  : 'text-zinc-400'
            }
          >
            {log}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleRunCommand}
        className="flex items-center gap-1.5 border-t border-zinc-800 pt-2"
      >
        <span className="text-zinc-400 select-none font-bold">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e): void => setInputVal(e.target.value)}
          placeholder="Run python command or script..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-300 text-xs font-mono"
        />
        <button
          type="submit"
          className="p-1 text-zinc-300 hover:text-zinc-300 transition-colors"
          title="Run"
        >
          <Play size={12} />
        </button>
      </form>
    </div>
  )
}
