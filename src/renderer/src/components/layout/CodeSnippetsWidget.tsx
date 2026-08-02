import React from 'react'
import { Code, Copy, Check, Sparkles } from 'lucide-react'

interface CodeSnippetsWidgetProps {
  onInsertSnippet?: (snippetText: string) => void
}

const SNIPPETS = [
  {
    title: 'Python Main Template',
    lang: 'python',
    code: `def main():\n    print("Hello from Notie Application!")\n\nif __name__ == "__main__":\n    main()`
  },
  {
    title: 'Markdown Table',
    lang: 'markdown',
    code: `| Feature | Status | Priority |\n| :--- | :---: | ---: |\n| Floating Widgets | Done | High |\n| Grammarly Assistant | Active | Medium |`
  },
  {
    title: 'Callout Alert Note',
    lang: 'markdown',
    code: `> [!NOTE]\n> Floating windows are dragable, resizable, and closable!`
  },
  {
    title: 'TypeScript Interface',
    lang: 'typescript',
    code: `interface WidgetConfig {\n  id: string;\n  name: string;\n  visible: boolean;\n}`
  }
]

export default function CodeSnippetsWidget({
  onInsertSnippet
}: CodeSnippetsWidgetProps): React.JSX.Element {
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null)

  const handleCopy = (code: string, idx: number): void => {
    void navigator.clipboard.writeText(code)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1800)
    if (onInsertSnippet) {
      onInsertSnippet(code)
    }
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3 text-xs overflow-y-auto">
      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
        <Sparkles size={12} className="text-amber-400" />
        <span>Click snippet to copy & insert</span>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
        {SNIPPETS.map((s, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 flex flex-col gap-1.5 hover:border-purple-500/50 transition-colors group cursor-pointer"
            onClick={(): void => handleCopy(s.code, idx)}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 text-[11px] flex items-center gap-1.5">
                <Code size={11} className="text-purple-400" />
                {s.title}
              </span>
              <button className="text-zinc-500 hover:text-zinc-200 transition-colors p-1">
                {copiedIdx === idx ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>

            <pre className="bg-zinc-950 p-2 rounded text-[10px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
