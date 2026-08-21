import React, { useState, useRef, useEffect } from 'react'
import { Share2, ChevronDown, Check, Copy, Globe, Radio, UserPlus } from 'lucide-react'

interface ShareMenuProps {
  activeFilePath?: string | null
  onCopyLink?: () => void
}

function ShareMenu({ activeFilePath, onCopyLink }: ShareMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [publishedWeb, setPublishedWeb] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleCopy = (): void => {
    if (onCopyLink) {
      onCopyLink()
    } else if (activeFilePath) {
      const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
      navigator.clipboard.writeText(`[[${baseName}]]`)
    }
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1800)
  }

  const handlePublishWeb = (): void => {
    setPublishedWeb(true)
    setTimeout(() => setPublishedWeb(false), 2000)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`action-pill-btn ${isOpen ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        title="Share & Collaborate"
      >
        <Share2 size={13} strokeWidth={1.75} className="shrink-0 text-zinc-300" />
        <ChevronDown
          size={10}
          className={`transition-transform duration-150 text-zinc-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="share-dropdown-menu" onClick={(e): void => e.stopPropagation()}>
          {/* Section: Collaboration */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Collaboration</span>

            {/* 1. Copy Document Reference Link */}
            <div className="share-dropdown-item" onClick={handleCopy}>
              <div className="flex items-center gap-2.5">
                {copiedLink ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={14} className="text-zinc-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="share-item-title">
                    {copiedLink ? 'Copied link to clipboard!' : 'Copy Reference Link'}
                  </span>
                  <span className="share-item-desc">Wikilink or internal doc link</span>
                </div>
              </div>
            </div>

            {/* 2. Invite Collaborators */}
            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setIsOpen(false)
                alert(
                  'Invite collaborators: Send email invites to collaborate live on this workspace.'
                )
              }}
            >
              <div className="flex items-center gap-2.5">
                <UserPlus size={14} className="text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Invite Collaborators</span>
                  <span className="share-item-desc">Add team members with edit access</span>
                </div>
              </div>
            </div>

            {/* 3. Live Peer Session */}
            <div
              className="share-dropdown-item"
              onClick={(): void => {
                setIsOpen(false)
                alert('Live Peer Session: Starting local peer-to-peer collaboration session...')
              }}
            >
              <div className="flex items-center gap-2.5">
                <Radio size={14} className="text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="share-item-title">Live Peer Session</span>
                  <span className="share-item-desc">Real-time collaborative editing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 my-1 mx-1" />

          {/* Section: Web Publishing */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Publish</span>

            {/* 4. Publish to Web */}
            <div className="share-dropdown-item" onClick={handlePublishWeb}>
              <div className="flex items-center gap-2.5">
                {publishedWeb ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Globe size={14} className="text-emerald-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="share-item-title">
                    {publishedWeb ? 'Public link generated!' : 'Publish to Web'}
                  </span>
                  <span className="share-item-desc">Make a read-only public web link</span>
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
