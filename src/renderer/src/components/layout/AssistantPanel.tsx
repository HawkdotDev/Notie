import React from 'react'
import { RefreshCw, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'

interface AssistantPanelProps {
  showRightPanel: boolean
  onClosePanel: () => void
}

export default function AssistantPanel({
  showRightPanel,
  onClosePanel
}: AssistantPanelProps): React.JSX.Element | null {
  if (!showRightPanel) return null

  return (
    <div className="editor-right-panel">
      <div className="right-panel-header">
        <div className="right-panel-title">
          <RefreshCw size={12} className="animate-spin-slow text-purple-400" />
          <span>Errors are being searched...</span>
        </div>
        <div
          className="right-panel-badge flex items-center gap-1"
          style={{ cursor: 'pointer' }}
          onClick={onClosePanel}
          title="Close Panel"
        >
          <SlidersHorizontal size={11} />
          <span>16</span>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <span>• Error Line 1</span>
          <button className="panel-card-btn flex items-center gap-1">
            <span>Fix line</span>
            <ChevronDown size={11} />
          </button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <span>• Error Line 5</span>
          <button className="panel-card-btn flex items-center gap-1">
            <span>Fix line</span>
            <ChevronUp size={11} />
          </button>
        </div>
        <div className="panel-card-body">
          In Python, the return statement is used to return a value from a function. In this
          example, the return statement was modified to use the correct variable name for the list.
          The old code used the variable name &#39;list2&#39;, which was incorrect, so the new code
          corrected it to &apos;list2&apos;, which is the correct variable name.
        </div>
        <div className="diff-preview-box">
          <span>list2</span>
          <span>›</span>
          <span className="diff-tag-highlight">list2</span>
        </div>
      </div>

      <button className="btn-fix-all" onClick={(): void => alert('Fix all issues triggered!')}>
        Fix all issues
      </button>
    </div>
  )
}
