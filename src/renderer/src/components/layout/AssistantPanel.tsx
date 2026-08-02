import React from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

export default function AssistantPanel(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full gap-3 p-3 text-xs overflow-y-auto">
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Error Line 1
          </span>
          <button className="panel-card-btn flex items-center gap-1">
            <span>Fix line</span>
            <ChevronDown size={11} />
          </button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Error Line 5
          </span>
          <button className="panel-card-btn flex items-center gap-1">
            <span>Fix line</span>
            <ChevronUp size={11} />
          </button>
        </div>
        <div className="panel-card-body text-zinc-400 leading-relaxed text-[11px]">
          In Python, the return statement is used to return a value from a function. In this
          example, the return statement was modified to use the correct variable name for the list.
          The old code used the variable name &#39;list2&#39;, which was incorrect, so the new code
          corrected it to &apos;list2&apos;, which is the correct variable name.
        </div>
        <div className="diff-preview-box font-mono">
          <span className="text-zinc-500 line-through">list1</span>
          <span className="text-zinc-600">›</span>
          <span className="diff-tag-highlight">list2</span>
        </div>
      </div>

      <button
        className="btn-fix-all flex items-center justify-center gap-1.5 mt-auto"
        onClick={(): void => alert('Fix all issues triggered!')}
      >
        <Sparkles size={13} />
        <span>Fix all 16 issues</span>
      </button>
    </div>
  )
}
