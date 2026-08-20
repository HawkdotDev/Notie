import React, { useState, useMemo, useCallback } from 'react'
import { Search, X, ListTree } from 'lucide-react'

interface OutlineWidgetProps {
  content: string
}

interface HeadingItem {
  id: string
  idx: number
  level: number
  text: string
  rawText: string
}

function cleanMarkdownHeading(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function OutlineWidgetComponent({ content }: OutlineWidgetProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null)

  const headings: HeadingItem[] = useMemo(() => {
    if (!content) return []
    return content
      .split('\n')
      .map((line, idx) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (!headingMatch) return null
        const level = headingMatch[1].length
        const rawText = headingMatch[2]
        const text = cleanMarkdownHeading(rawText)
        return {
          id: `heading-${idx}-${level}`,
          idx,
          level,
          text,
          rawText
        }
      })
      .filter(Boolean) as HeadingItem[]
  }, [content])

  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return headings
    const q = searchQuery.toLowerCase().trim()
    return headings.filter((h) => h.text.toLowerCase().includes(q))
  }, [headings, searchQuery])

  const scrollToHeading = useCallback((item: HeadingItem): void => {
    setActiveHeadingText(item.text)
    const editorElem =
      document.querySelector('.editor-container') ||
      document.querySelector('.codex-editor') ||
      document.querySelector('.editor-wrapper')

    if (!editorElem) return

    const headers = editorElem.querySelectorAll('h1, h2, h3, h4, h5, h6, .ce-header')
    const search = item.text.trim().toLowerCase()

    for (const h of Array.from(headers)) {
      const cleanHText = (h.textContent || '').trim().toLowerCase()
      if (cleanHText === search || cleanHText.includes(search) || search.includes(cleanHText)) {
        h.scrollIntoView({ behavior: 'smooth', block: 'center' })
        h.classList.add('outline-target-highlight')
        setTimeout(() => {
          h.classList.remove('outline-target-highlight')
        }, 1200)
        break
      }
    }
  }, [])

  return (
    <div className="outline-widget-root">
      {/* Search / Filter bar if more than 3 headings */}
      {headings.length > 3 && (
        <div className="outline-search-box">
          <Search size={12} strokeWidth={1.75} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            className="outline-search-input"
            placeholder="Filter outline..."
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="outline-search-clear"
              onClick={(): void => setSearchQuery('')}
              title="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* Headings List */}
      <div className="outline-list-container">
        {filteredHeadings.length > 0 ? (
          <div className="outline-tree">
            {filteredHeadings.map((h) => {
              const isActive = activeHeadingText === h.text
              return (
                <div
                  key={h.id}
                  className={`outline-item level-${h.level} ${isActive ? 'is-active' : ''}`}
                  style={{
                    paddingLeft: `${Math.max(8, (h.level - 1) * 14 + 8)}px`
                  }}
                  onClick={(): void => scrollToHeading(h)}
                  title={h.text}
                >
                  <div className="outline-level-pill">
                    <span className="outline-level-text">H{h.level}</span>
                  </div>
                  <span className="outline-item-text">{h.text || 'Untitled'}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="outline-empty-state">
            <div className="outline-empty-icon-wrap">
              <ListTree size={20} strokeWidth={1.5} className="text-zinc-500" />
            </div>
            <p className="outline-empty-title">
              {searchQuery ? 'No matching headings' : 'No headings found'}
            </p>
            <p className="outline-empty-desc">
              {searchQuery
                ? 'Try a different search term.'
                : 'Use # Heading 1, ## Heading 2 in your notes to build an outline.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {headings.length > 0 && (
        <div className="outline-footer-stats">
          <span>
            {headings.length} {headings.length === 1 ? 'heading' : 'headings'}
          </span>
          {searchQuery && filteredHeadings.length !== headings.length && (
            <span>
              {' '}
              • {filteredHeadings.length} match{filteredHeadings.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(OutlineWidgetComponent)
