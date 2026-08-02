import React from 'react'
import { FileText, Clock, Hash, AlignLeft, List } from 'lucide-react'

interface DocumentStatsWidgetProps {
  content: string
  activeFileName?: string
}

export default function DocumentStatsWidget({
  content,
  activeFileName
}: DocumentStatsWidgetProps): React.JSX.Element {
  const words = React.useMemo(() => {
    if (!content.trim()) return 0
    return content.trim().split(/\s+/).length
  }, [content])

  const chars = content.length
  const lines = content ? content.split('\n').length : 0
  const readingTime = Math.ceil(words / 200)

  // Extract Markdown headings for outline
  const headings = React.useMemo(() => {
    if (!content) return []
    const lineArr = content.split('\n')
    const matches: { level: number; text: string; line: number }[] = []
    lineArr.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        matches.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index + 1
        })
      }
    })
    return matches
  }, [content])

  return (
    <div className="flex flex-col h-full gap-3 p-3 text-xs overflow-y-auto">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center gap-2">
          <FileText size={14} className="text-purple-400" />
          <div>
            <div className="font-bold text-zinc-200">{words}</div>
            <div className="text-[10px] text-zinc-500">Words</div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center gap-2">
          <Hash size={14} className="text-emerald-400" />
          <div>
            <div className="font-bold text-zinc-200">{chars}</div>
            <div className="text-[10px] text-zinc-500">Characters</div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center gap-2">
          <AlignLeft size={14} className="text-blue-400" />
          <div>
            <div className="font-bold text-zinc-200">{lines}</div>
            <div className="text-[10px] text-zinc-500">Lines</div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center gap-2">
          <Clock size={14} className="text-amber-400" />
          <div>
            <div className="font-bold text-zinc-200">{readingTime} min</div>
            <div className="text-[10px] text-zinc-500">Read Time</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-h-0 border-t border-zinc-800/60 pt-2">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-400 text-[11px]">
          <List size={12} />
          <span>Document Outline ({headings.length})</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {headings.length > 0 ? (
            headings.map((h, i) => (
              <div
                key={i}
                className="hover:bg-zinc-800/50 p-1 rounded text-zinc-300 truncate cursor-pointer transition-colors"
                style={{ paddingLeft: `${(h.level - 1) * 10 + 4}px` }}
              >
                <span className="text-purple-400 font-mono text-[10px] mr-1.5">H{h.level}</span>
                {h.text}
              </div>
            ))
          ) : (
            <div className="text-zinc-600 italic py-2 text-center text-[11px]">
              No headings in {activeFileName || 'document'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
