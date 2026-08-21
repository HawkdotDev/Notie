import React, { useState, useRef, useEffect } from 'react'
import {
  Eye,
  ChevronDown,
  Layers,
  ListTree,
  Check,
  Image,
  Smile,
  FileText,
  FileCode
} from 'lucide-react'

interface ViewModeMenuProps {
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  activeFilePath?: string | null
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function ViewModeMenu({
  showTabs = true,
  onToggleTabs,
  showRightSidebar,
  onToggleRightSidebar,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  activeFilePath,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile
}: ViewModeMenuProps): React.JSX.Element {
  const [showViewMenu, setShowViewMenu] = useState<boolean>(false)
  const viewMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false)
      }
    }
    if (showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showViewMenu])

  return (
    <div className="relative" ref={viewMenuRef}>
      <button
        type="button"
        className={`action-pill-btn ${showViewMenu ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setShowViewMenu((prev) => !prev)
        }}
        title="View Options & Layout"
      >
        <Eye size={13} className={showViewMenu ? 'text-zinc-200' : ''} />
        <span>View</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-150 ${showViewMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {showViewMenu && (
        <div className="widgets-dropdown-menu view-dropdown-menu">
          <div className="widgets-dropdown-header">
            <span className="font-semibold text-zinc-300">View & Layout</span>
          </div>

          <div className="widgets-dropdown-list">
            {/* 1. Toggle Tabs */}
            {onToggleTabs && (
              <div
                className={`widget-menu-item ${showTabs ? 'selected' : ''}`}
                onClick={onToggleTabs}
              >
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">Editor Tabs</span>
                    <span className="widget-desc">Show open document tabs</span>
                  </div>
                </div>
                <div className={`widget-checkbox ${showTabs ? 'checked' : ''}`}>
                  {showTabs && <Check size={11} />}
                </div>
              </div>
            )}

            {/* 2. Toggle Document Outline */}
            <div
              className={`widget-menu-item ${showRightSidebar ? 'selected' : ''}`}
              onClick={onToggleRightSidebar}
            >
              <div className="flex items-center gap-2">
                <ListTree size={13} className="text-zinc-300 shrink-0" />
                <div className="flex flex-col">
                  <span className="widget-title">Document Outline</span>
                  <span className="widget-desc">Sidebar table of contents</span>
                </div>
              </div>
              <div className={`widget-checkbox ${showRightSidebar ? 'checked' : ''}`}>
                {showRightSidebar && <Check size={11} />}
              </div>
            </div>

            {/* 3. Page Elements Section */}
            {(onToggleCover || onToggleIcon || onToggleFileName) && (
              <>
                <div className="menu-divider my-1 border-t border-zinc-800" />
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                  Page Elements
                </div>

                {/* Only this file option */}
                {activeFilePath && onToggleOnlyThisFile && (
                  <div
                    className={`widget-menu-item ${isOnlyThisFile ? 'selected' : ''}`}
                    onClick={onToggleOnlyThisFile}
                    title="When enabled, display settings are saved to this file's frontmatter metadata"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode size={13} className="text-purple-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title text-zinc-200">Only this file</span>
                        <span className="widget-desc text-zinc-500">Save to file metadata</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${isOnlyThisFile ? 'checked' : ''}`}>
                      {isOnlyThisFile && <Check size={11} />}
                    </div>
                  </div>
                )}

                {/* Cover banner toggle */}
                {onToggleCover && (
                  <div
                    className={`widget-menu-item ${showCover ? 'selected' : ''}`}
                    onClick={onToggleCover}
                  >
                    <div className="flex items-center gap-2">
                      <Image size={13} className="text-zinc-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title">Cover Banner</span>
                        <span className="widget-desc">Top cover image/gradient</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${showCover ? 'checked' : ''}`}>
                      {showCover && <Check size={11} />}
                    </div>
                  </div>
                )}

                {/* Page icon toggle */}
                {onToggleIcon && (
                  <div
                    className={`widget-menu-item ${showIcon ? 'selected' : ''}`}
                    onClick={onToggleIcon}
                  >
                    <div className="flex items-center gap-2">
                      <Smile size={13} className="text-zinc-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title">Page Icon</span>
                        <span className="widget-desc">Emoji icon badge</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${showIcon ? 'checked' : ''}`}>
                      {showIcon && <Check size={11} />}
                    </div>
                  </div>
                )}

                {/* File name toggle */}
                {onToggleFileName && (
                  <div
                    className={`widget-menu-item ${showFileName ? 'selected' : ''}`}
                    onClick={onToggleFileName}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-zinc-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="widget-title">File Name</span>
                        <span className="widget-desc">Document title heading</span>
                      </div>
                    </div>
                    <div className={`widget-checkbox ${showFileName ? 'checked' : ''}`}>
                      {showFileName && <Check size={11} />}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ViewModeMenu)
