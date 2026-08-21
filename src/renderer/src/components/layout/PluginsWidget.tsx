import React, { useState, useMemo } from 'react'
import {
  Search,
  Blocks,
  Sigma,
  Calendar,
  PenTool,
  Play,
  GitBranch,
  BrainCircuit,
  Timer,
  GitPullRequest,
  X,
  Download
} from 'lucide-react'

export interface PluginDefinition {
  id: string
  name: string
  version: string
  author: string
  description: string
  category: 'Editor' | 'Visuals' | 'Tools' | 'Integrations'
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  tags: string[]
  downloads: string
  verified?: boolean
}

const AVAILABLE_PLUGINS: PluginDefinition[] = [
  {
    id: 'katex-math',
    name: 'LaTeX & Math (KaTeX)',
    version: '1.4.2',
    author: 'Mink Core',
    description: 'Render inline $math$ formulas and display block $$equations$$ seamlessly.',
    category: 'Editor',
    icon: Sigma,
    tags: ['math', 'latex', 'formulas'],
    downloads: '14.2k',
    verified: true
  },
  {
    id: 'daily-notes',
    name: 'Daily Notes & Journal',
    version: '2.1.0',
    author: 'Mink Core',
    description: 'Date-stamped daily journals, periodic logs, and reflection scratchpads.',
    category: 'Tools',
    icon: Calendar,
    tags: ['journal', 'calendar', 'log'],
    downloads: '28.6k',
    verified: true
  },
  {
    id: 'mermaid-pro',
    name: 'Mermaid Diagrams Pro',
    version: '1.2.0',
    author: 'MermaidJS Community',
    description: 'Interactive sequence diagrams, flowcharts, class models, and Gantt charts.',
    category: 'Visuals',
    icon: GitPullRequest,
    tags: ['diagrams', 'charts', 'uml'],
    downloads: '19.8k',
    verified: true
  },
  {
    id: 'excalidraw',
    name: 'Excalidraw Whiteboard',
    version: '1.0.8',
    author: 'Excalidraw Lab',
    description: 'Infinite virtual whiteboard for sketching ideas, wireframes, and workflows.',
    category: 'Visuals',
    icon: PenTool,
    tags: ['sketch', 'whiteboard', 'canvas'],
    downloads: '11.5k',
    verified: true
  },
  {
    id: 'code-runner',
    name: 'Code Runner',
    version: '0.9.4',
    author: 'DevTools Lab',
    description: 'Execute code snippets (JS, Python, Shell) with live inline output stream.',
    category: 'Tools',
    icon: Play,
    tags: ['code', 'python', 'exec'],
    downloads: '8.7k',
    verified: false
  },
  {
    id: 'git-sync',
    name: 'Git Vault Sync',
    version: '1.1.5',
    author: 'DevTools Lab',
    description: 'Automated backup, commit history, and GitHub remote repository sync.',
    category: 'Integrations',
    icon: GitBranch,
    tags: ['git', 'backup', 'cloud'],
    downloads: '22.1k',
    verified: false
  },
  {
    id: 'flashcards',
    name: 'Spaced Repetition',
    version: '1.3.0',
    author: 'LearningWorks',
    description: 'Transform markdown bullets and question cards into active recall decks.',
    category: 'Tools',
    icon: BrainCircuit,
    tags: ['study', 'anki', 'recall'],
    downloads: '16.4k',
    verified: false
  },
  {
    id: 'pomodoro-timer',
    name: 'Focus Mode & Pomodoro',
    version: '1.0.2',
    author: 'Mink Core',
    description: 'Customizable 25/5 focus interval timer with status bar indicator.',
    category: 'Tools',
    icon: Timer,
    tags: ['timer', 'focus', 'flow'],
    downloads: '12.0k',
    verified: true
  }
]

interface PluginsWidgetProps {
  enabledPlugins: Record<string, boolean>
  onTogglePlugin: (pluginId: string) => void
}

export default function PluginsWidget({
  enabledPlugins,
  onTogglePlugin
}: PluginsWidgetProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const activeCount = Object.values(enabledPlugins).filter(Boolean).length

  const filterTabs = [
    { id: 'all', label: 'All', count: AVAILABLE_PLUGINS.length },
    { id: 'installed', label: 'Installed', count: activeCount },
    { id: 'Editor', label: 'Editor' },
    { id: 'Tools', label: 'Tools' },
    { id: 'Visuals', label: 'Visuals' }
  ]

  const filteredPlugins = useMemo(() => {
    return AVAILABLE_PLUGINS.filter((plugin) => {
      const isEnabled = !!enabledPlugins[plugin.id]
      let matchesTab = true

      if (selectedFilter === 'installed') {
        matchesTab = isEnabled
      } else if (selectedFilter !== 'all') {
        matchesTab = plugin.category === selectedFilter
      }

      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesTab

      const matchesSearch =
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.tags.some((t) => t.toLowerCase().includes(q)) ||
        plugin.author.toLowerCase().includes(q)

      return matchesTab && matchesSearch
    })
  }, [searchQuery, selectedFilter, enabledPlugins])

  return (
    <div className="extension-view-root flex flex-col h-full select-none bg-[#111113] text-zinc-300">
      {/* Top Search & Filter Bar */}
      <div className="extension-view-search-box p-2 border-b border-[#202026] bg-[#141417]/80">
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            className="w-full bg-[#1b1b20] border border-[#2a2a32] text-xs text-zinc-200 pl-8 pr-7 py-1 focus:outline-none focus:border-[#4a4a58] placeholder-zinc-600 transition-colors"
            placeholder="Search extensions by name or tag..."
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 text-zinc-500 hover:text-zinc-300"
              onClick={(): void => setSearchQuery('')}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`text-[10px] px-2 py-0.5 font-medium transition-all whitespace-nowrap border ${
                selectedFilter === tab.id
                  ? 'bg-[#24242c] text-zinc-100 border-[#3c3c4a]'
                  : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border-[#23232a] hover:border-[#2e2e38]'
              }`}
              onClick={(): void => setSelectedFilter(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-[9px] font-mono text-zinc-500">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Extension List */}
      <div className="extension-view-list flex-1 overflow-y-auto p-2 space-y-2">
        {filteredPlugins.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
            <Blocks size={20} className="mb-2 text-zinc-600" />
            <p className="text-zinc-400 font-medium">No extensions found</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {searchQuery
                ? `No results matching "${searchQuery}"`
                : 'No extensions in this category'}
            </p>
            {(searchQuery || selectedFilter !== 'all') && (
              <button
                type="button"
                className="mt-3 text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                onClick={(): void => {
                  setSearchQuery('')
                  setSelectedFilter('all')
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          filteredPlugins.map((plugin) => {
            const isEnabled = !!enabledPlugins[plugin.id]
            const Icon = plugin.icon

            return (
              <div
                key={plugin.id}
                className={`extension-card group p-2.5 border transition-all ${
                  isEnabled
                    ? 'bg-[#18181e] border-[#2a2a34] hover:border-[#383846]'
                    : 'bg-[#141418] border-[#202026] hover:border-[#2a2a32]'
                }`}
              >
                {/* Top Row: Icon + Name + Version + Toggle */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 border flex items-center justify-center shrink-0 transition-colors ${
                        isEnabled
                          ? 'bg-[#22222a] text-zinc-200 border-[#383844]'
                          : 'bg-[#18181c] text-zinc-500 border-[#24242c]'
                      }`}
                    >
                      <Icon size={13} strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                          {plugin.name}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-500 bg-[#101014] px-1 py-0.2 border border-[#222228]">
                          v{plugin.version}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate font-normal">
                        by {plugin.author} • {plugin.downloads}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={(): void => onTogglePlugin(plugin.id)}
                    className={`text-[10px] px-2 py-0.5 font-medium border transition-colors shrink-0 flex items-center gap-1.5 ${
                      isEnabled
                        ? 'bg-[#24242c] text-zinc-200 border-[#383846] hover:bg-[#2c2c36] hover:border-[#484856]'
                        : 'bg-[#16161a] text-zinc-400 border-[#26262e] hover:bg-[#202026] hover:text-zinc-200 hover:border-[#32323c]'
                    }`}
                    title={isEnabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {isEnabled ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <Download size={10} className="text-zinc-400" />
                        <span>Enable</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-zinc-400 leading-normal mb-2">
                  {plugin.description}
                </p>

                {/* Tags & Meta Row */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e1e24]/80">
                  <div className="flex items-center gap-1 flex-wrap">
                    {plugin.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1 py-0.2 bg-[#101014] text-zinc-500 border border-[#202026] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider">
                    {plugin.category}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Stats Bar */}
      <div className="extension-view-footer px-3 py-1.5 border-t border-[#202026] bg-[#121215] text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>
          {AVAILABLE_PLUGINS.length} Extensions • {activeCount} Active
        </span>
        <span className="text-zinc-600">Mink v1.0</span>
      </div>
    </div>
  )
}
