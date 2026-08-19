import React from 'react'

interface OutlineWidgetProps {
  content: string
}

function OutlineWidgetComponent({ content }: OutlineWidgetProps): React.JSX.Element {
  const headings = content
    .split('\n')
    .map((line, idx) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (!headingMatch) return null
      return { idx, level: headingMatch[1].length, text: headingMatch[2] }
    })
    .filter(Boolean) as { idx: number; level: number; text: string }[]

  const scrollToHeading = (text: string): void => {
    const editorElem = document.querySelector('.editor-container')
    if (!editorElem) return
    const headers = editorElem.querySelectorAll('h1, h2, h3, h4, h5, h6, .ce-header')
    for (const h of Array.from(headers)) {
      if (h.textContent?.trim().includes(text.trim())) {
        h.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
    }
  }

  return (
    <div className="flex flex-col gap-1 text-[11px] text-zinc-400 p-2">
      {headings.length > 0 ? (
        headings.map((h) => (
          <div
            key={h.idx}
            className="flex items-center gap-1.5 py-1 px-2 hover:bg-zinc-800/50 cursor-pointer transition-colors"
            style={{ paddingLeft: `${(h.level - 1) * 10 + 8}px` }}
            onClick={(): void => scrollToHeading(h.text)}
          >
            <span className="text-zinc-400 font-mono text-[9px] shrink-0">H{h.level}</span>
            <span className="truncate text-zinc-300">{h.text}</span>
          </div>
        ))
      ) : (
        <div className="text-zinc-600 text-center py-4 italic text-[11px]">No headings found</div>
      )}
    </div>
  )
}

export default React.memo(OutlineWidgetComponent)
