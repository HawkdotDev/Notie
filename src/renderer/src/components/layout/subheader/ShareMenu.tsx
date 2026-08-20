import React, { useState, useRef, useEffect } from 'react'
import { Share2, ChevronDown, Check, Copy, Users, Code2, FileText, Download } from 'lucide-react'

interface ShareMenuProps {
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
}

function ShareMenu({
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink
}: ShareMenuProps): React.JSX.Element {
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false)
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareMenu])

  return (
    <div className="relative" ref={shareMenuRef}>
      <button
        type="button"
        className={`action-pill-btn ${showShareMenu ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setShowShareMenu((prev) => !prev)
        }}
        title="Share & Export Document"
      >
        <Share2 size={12} strokeWidth={1.75} className="shrink-0 text-zinc-300" />
        <span>Share</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-150 ${showShareMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {showShareMenu && (
        <div className="share-dropdown-menu">
          {/* Collaboration Section */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Collaboration</span>
            <div
              className="share-dropdown-item"
              onClick={(): void => {
                if (onCopyLink) {
                  onCopyLink()
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
                setCopyFeedback(true)
                setTimeout(() => setCopyFeedback(false), 1500)
              }}
            >
              <div className="flex items-center gap-2.5">
                {copyFeedback ? (
                  <Check size={13} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={13} className="text-zinc-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="share-item-title">
                    {copyFeedback ? 'Copied to Clipboard!' : 'Copy Reference Link'}
                  </span>
                  <span className="share-item-desc">Wikilink or internal document link</span>
                </div>
              </div>
            </div>

            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setShowShareMenu(false)
                alert('Invite collaborators feature coming soon!')
              }}
            >
              <div className="flex items-center gap-2.5">
                <Users size={13} className="text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Invite Collaborators</span>
                  <span className="share-item-desc">Add team members to this workspace</span>
                </div>
              </div>
            </div>
          </div>

          <div className="share-dropdown-divider" />

          {/* Export Section */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Export Document</span>
            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setShowShareMenu(false)
                onExportHTML?.()
              }}
            >
              <div className="flex items-center gap-2.5">
                <Code2 size={13} className="text-zinc-300 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Export as HTML</span>
                  <span className="share-item-desc">Formatted standalone HTML file</span>
                </div>
              </div>
            </div>

            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setShowShareMenu(false)
                onExportText?.()
              }}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={13} className="text-zinc-300 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Export as Plain Text</span>
                  <span className="share-item-desc">Clean .txt file without formatting</span>
                </div>
              </div>
            </div>

            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setShowShareMenu(false)
                onExportMarkdown?.()
              }}
            >
              <div className="flex items-center gap-2.5">
                <Download size={13} className="text-zinc-300 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Export as Markdown</span>
                  <span className="share-item-desc">Raw Markdown syntax file</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ShareMenu)
