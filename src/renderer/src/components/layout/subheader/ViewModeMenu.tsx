import React, { useState, useRef, useEffect } from 'react'
import { Eye, ChevronDown, Layers, ListTree, Check } from 'lucide-react'

interface ViewModeMenuProps {
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
}

function ViewModeMenu({
  showTabs = true,
  onToggleTabs,
  showRightSidebar,
  onToggleRightSidebar
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
        title="View Options & Typography"
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
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ViewModeMenu)
