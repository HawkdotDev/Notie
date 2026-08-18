import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  Wand2,
  FileText,
  RefreshCw,
  Send,
  Zap,
  BookOpen,
  ArrowRight
} from 'lucide-react'

interface IssueItem {
  id: string
  line: number
  type: 'grammar' | 'style' | 'redundancy' | 'passive'
  label: string
  explanation: string
  originalText: string
  suggestedText: string
}

interface AssistantPanelProps {
  activeFilePath?: string | null
  content?: string
  onUpdateContent?: (newContent: string) => void
}

export default function AssistantPanel({
  activeFilePath,
  content = '',
  onUpdateContent
}: AssistantPanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'ai-tools' | 'ask'>('diagnostics')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiOutput, setAiOutput] = useState<string | null>(null)

  // Real-time grammar, style, and redundancy diagnostics engine
  const issues = useMemo<IssueItem[]>(() => {
    if (!content.trim()) return []

    const detected: IssueItem[] = []
    const lines = content.split(/\r?\n/)

    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1

      // 1. Check for passive voice patterns
      const passiveMatches = lineText.match(/\b(was|were|is|are|been|being)\s+([a-z]+ed)\s+(by)\b/i)
      if (passiveMatches) {
        detected.push({
          id: `passive_${lineNum}_${passiveMatches.index}`,
          line: lineNum,
          type: 'passive',
          label: `Passive Voice (Line ${lineNum})`,
          explanation: 'Use active voice for clearer and more compelling writing.',
          originalText: passiveMatches[0],
          suggestedText: passiveMatches[2].replace(/ed$/, 's')
        })
      }

      // 2. Check for wordy / redundant phrases
      const redundancyRules = [
        { wordy: 'in order to', better: 'to' },
        { wordy: 'at this point in time', better: 'now' },
        { wordy: 'due to the fact that', better: 'because' },
        { wordy: 'utilize', better: 'use' },
        { wordy: 'very unique', better: 'unique' }
      ]

      redundancyRules.forEach((rule) => {
        if (lineText.toLowerCase().includes(rule.wordy)) {
          detected.push({
            id: `redundant_${lineNum}_${rule.wordy}`,
            line: lineNum,
            type: 'redundancy',
            label: `Wordy Phrase (Line ${lineNum})`,
            explanation: `Simplify "${rule.wordy}" to improve conciseness.`,
            originalText: rule.wordy,
            suggestedText: rule.better
          })
        }
      })

      // 3. Check for repeated words
      const repeatedWordMatch = lineText.match(/\b([a-z]+)\s+\1\b/i)
      if (repeatedWordMatch) {
        detected.push({
          id: `repeat_${lineNum}_${repeatedWordMatch.index}`,
          line: lineNum,
          type: 'grammar',
          label: `Duplicate Word (Line ${lineNum})`,
          explanation: `Remove duplicated word "${repeatedWordMatch[1]}".`,
          originalText: repeatedWordMatch[0],
          suggestedText: repeatedWordMatch[1]
        })
      }
    })

    return detected
  }, [content])

  // Live readability & document metrics
  const stats = useMemo(() => {
    const text = content.trim()
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0
    const chars = text.length
    const readingTime = Math.max(1, Math.ceil(words / 200))
    const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0
    const gradeLevel =
      words > 0 && sentences > 0
        ? Math.min(
            12,
            Math.max(1, Math.round(0.39 * (words / sentences) + 11.8 * (chars / words) - 15.59))
          )
        : 5

    return { words, chars, readingTime, gradeLevel }
  }, [content])

  // Apply single diagnostic fix live to document
  const handleApplyFix = (issue: IssueItem): void => {
    if (!onUpdateContent || !content) return
    const updated = content.replace(issue.originalText, issue.suggestedText)
    onUpdateContent(updated)
  }

  // Fix all detected issues automatically
  const handleFixAll = (): void => {
    if (!onUpdateContent || !content || issues.length === 0) return
    let updated = content
    issues.forEach((issue) => {
      updated = updated.replace(issue.originalText, issue.suggestedText)
    })
    onUpdateContent(updated)
  }

  // Trigger prototype AI Actions
  const handleAiAction = (actionType: string): void => {
    setIsProcessing(true)
    setAiOutput(null)

    setTimeout(() => {
      setIsProcessing(false)
      if (actionType === 'fix-grammar') {
        let fixed = content
        issues.forEach((i) => {
          fixed = fixed.replace(i.originalText, i.suggestedText)
        })
        if (onUpdateContent) onUpdateContent(fixed)
        setAiOutput('✨ Automatically polished grammar, passive voice, and wordy phrases!')
      } else if (actionType === 'summarize') {
        const summary = `### 📝 AI Executive Summary\n- **Document**: ${activeFilePath ? activeFilePath.split(/[\\/]/).pop() : 'Note'}\n- **Word Count**: ${stats.words} words\n- **Key Highlight**: Main concepts structured cleanly with actionable sections.`
        setAiOutput(summary)
      } else if (actionType === 'takeaways') {
        const takeaways = `### 🎯 Key Action Items & Takeaways\n1. Review project milestones and technical requirements.\n2. Ensure code compliance and responsive styling.\n3. Execute production build verification.`
        setAiOutput(takeaways)
      } else if (actionType === 'continue') {
        const addition = `\n\n### 🚀 Next Steps & Expansion\nBuilding upon the established architecture, the next iteration will focus on enhancing performance, extending modular capabilities, and refining user experience polish.`
        if (onUpdateContent) onUpdateContent(content + addition)
        setAiOutput('💡 Drafted and appended the next section to your document!')
      }
    }, 600)
  }

  // Custom AI Prompt Handler
  const handleCustomPromptSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!customPrompt.trim()) return

    setIsProcessing(true)
    setAiOutput(null)

    setTimeout(() => {
      setIsProcessing(false)
      const response = `### 🤖 AI Suggestion for: "${customPrompt}"\n\nHere is a refined version tailored to your request:\n> ${customPrompt.toLowerCase().includes('translate') ? 'Traduction effectuée avec succès pour le document actif.' : 'The writing style has been enhanced with professional terminology, clear transitions, and concise structure.'}`
      setAiOutput(response)
      setCustomPrompt('')
    }, 700)
  }

  return (
    <div className="flex flex-col h-full bg-[#18181c] text-zinc-300 text-xs overflow-hidden">
      {/* 1. Header Metrics Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#292932] bg-[#141417]">
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>
            <strong className="text-zinc-200">{stats.words}</strong> words
          </span>
          <span>
            <strong className="text-zinc-200">{stats.readingTime}m</strong> read
          </span>
          <span className="text-zinc-300 font-medium">Grade {stats.gradeLevel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'diagnostics'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={(): void => setActiveTab('diagnostics')}
          >
            Issues ({issues.length})
          </button>
          <button
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'ai-tools'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={(): void => setActiveTab('ai-tools')}
          >
            AI Actions
          </button>
          <button
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'ask' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={(): void => setActiveTab('ask')}
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: Real-time Issues & Diagnostics */}
        {activeTab === 'diagnostics' && (
          <>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-2 text-zinc-500">
                <CheckCircle2 size={28} className="text-emerald-400" />
                <p className="font-medium text-zinc-300">Writing looks great!</p>
                <p className="text-[11px] max-w-50">
                  No grammar, passive voice, or wordiness issues detected in current document.
                </p>
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-[#1c1c22] border border-[#2e2e3a] p-2.5 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-zinc-200 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 bg-zinc-400" />
                      {issue.label}
                    </span>
                    <button
                      className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-medium transition-colors flex items-center gap-1"
                      onClick={(): void => handleApplyFix(issue)}
                    >
                      Fix <ArrowRight size={10} />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">{issue.explanation}</p>
                  <div className="bg-[#141417] p-1.5 border border-[#262630] font-mono text-[10px] flex items-center gap-2">
                    <span className="line-through text-rose-400">{issue.originalText}</span>
                    <span className="text-zinc-500">›</span>
                    <span className="text-emerald-400 font-semibold">{issue.suggestedText}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* TAB 2: AI Prompt Actions */}
        {activeTab === 'ai-tools' && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-400 font-medium">
              1-Click AI Writing Transformations:
            </p>
            <button
              className="w-full text-left p-2 bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e3a] transition-colors flex items-center justify-between group"
              onClick={(): void => handleAiAction('fix-grammar')}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <div>
                  <div className="font-semibold text-zinc-200">Fix Grammar & Flow</div>
                  <div className="text-[10px] text-zinc-400">Clean up typos and active voice</div>
                </div>
              </div>
              <Wand2 size={12} className="text-zinc-500 group-hover:text-zinc-200" />
            </button>

            <button
              className="w-full text-left p-2 bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e3a] transition-colors flex items-center justify-between group"
              onClick={(): void => handleAiAction('summarize')}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-400" />
                <div>
                  <div className="font-semibold text-zinc-200">Summarize Note</div>
                  <div className="text-[10px] text-zinc-400">Generate executive summary</div>
                </div>
              </div>
              <Wand2 size={12} className="text-zinc-500 group-hover:text-zinc-200" />
            </button>

            <button
              className="w-full text-left p-2 bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e3a] transition-colors flex items-center justify-between group"
              onClick={(): void => handleAiAction('takeaways')}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-emerald-400" />
                <div>
                  <div className="font-semibold text-zinc-200">Extract Key Takeaways</div>
                  <div className="text-[10px] text-zinc-400">Pull action items and insights</div>
                </div>
              </div>
              <Wand2 size={12} className="text-zinc-500 group-hover:text-zinc-200" />
            </button>

            <button
              className="w-full text-left p-2 bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e3a] transition-colors flex items-center justify-between group"
              onClick={(): void => handleAiAction('continue')}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-zinc-200" />
                <div>
                  <div className="font-semibold text-zinc-200">Continue Writing</div>
                  <div className="text-[10px] text-zinc-400">Draft the next logical section</div>
                </div>
              </div>
              <Wand2 size={12} className="text-zinc-500 group-hover:text-zinc-200" />
            </button>
          </div>
        )}

        {/* TAB 3: Custom AI Prompt Query */}
        {activeTab === 'ask' && (
          <form onSubmit={handleCustomPromptSubmit} className="space-y-2">
            <label className="text-[11px] text-zinc-400 font-medium block">
              Ask AI Assistant to edit, format, or transform:
            </label>
            <textarea
              className="w-full h-20 bg-[#141417] border border-[#2e2e3a] p-2 text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500 text-xs resize-none"
              placeholder="e.g., Make tone formal, convert to table, or translate to French..."
              value={customPrompt}
              onChange={(e): void => setCustomPrompt(e.target.value)}
            />
            <button
              type="submit"
              disabled={isProcessing || !customPrompt.trim()}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send size={12} />
              <span>Ask AI Assistant</span>
            </button>
          </form>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4 text-zinc-300 font-medium">
            <RefreshCw size={14} className="animate-spin" />
            <span>AI Assistant is analyzing document...</span>
          </div>
        )}

        {/* AI Response Output Box */}
        {aiOutput && !isProcessing && (
          <div className="bg-[#1c1c22] border border-zinc-700 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-zinc-200 font-semibold text-[11px]">
              <span className="flex items-center gap-1">
                <Sparkles size={12} /> AI Result
              </span>
              <button
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                onClick={(): void => setAiOutput(null)}
              >
                Clear
              </button>
            </div>
            <div className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {aiOutput}
            </div>
            <button
              className="w-full py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-medium transition-colors"
              onClick={(): void => {
                if (onUpdateContent && content) {
                  onUpdateContent(content + '\n\n' + aiOutput)
                }
              }}
            >
              Insert into Document
            </button>
          </div>
        )}
      </div>

      {/* 3. Footer Fix All Action Button */}
      {issues.length > 0 && activeTab === 'diagnostics' && (
        <div className="p-3 border-t border-[#292932] bg-[#141417]">
          <button
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium flex items-center justify-center gap-1.5 transition-all"
            onClick={handleFixAll}
          >
            <Sparkles size={13} />
            <span>Fix all {issues.length} issues</span>
          </button>
        </div>
      )}
    </div>
  )
}
