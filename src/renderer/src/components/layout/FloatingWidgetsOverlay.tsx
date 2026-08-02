import React from 'react'
import { Sparkles, BarChart2, Terminal, Code2 } from 'lucide-react'
import FloatingWindow from './FloatingWindow'
import AssistantPanel from './AssistantPanel'
import DocumentStatsWidget from './DocumentStatsWidget'
import QuickTerminalWidget from './QuickTerminalWidget'
import CodeSnippetsWidget from './CodeSnippetsWidget'
import { WidgetState, WidgetLayout, ViewMode } from '../../types'

interface FloatingWidgetsOverlayProps {
  viewMode: ViewMode
  widgetState: WidgetState
  widgetZIndexes: Record<string, number>
  widgetPositions: Record<string, WidgetLayout>
  activeFilePath: string | null
  fileContents: Record<string, string>
  bringWidgetToFront: (id: string) => void
  handleToggleWidget: (id: keyof WidgetState) => void
  handleWidgetLayoutChange: (
    id: string,
    pos: { x: number; y: number },
    size: { width: number; height: number }
  ) => void
  onInsertSnippet: (snippetText: string) => void
}

function FloatingWidgetsOverlayComponent({
  viewMode,
  widgetState,
  widgetZIndexes,
  widgetPositions,
  activeFilePath,
  fileContents,
  bringWidgetToFront,
  handleToggleWidget,
  handleWidgetLayoutChange,
  onInsertSnippet
}: FloatingWidgetsOverlayProps): React.JSX.Element | null {
  if (viewMode === 'graph') return null

  return (
    <>
      {widgetState.assistant && (
        <FloatingWindow
          id="assistant"
          title="Writing Assistant"
          icon={<Sparkles size={13} className="text-purple-400" />}
          badge={
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
              16 issues
            </span>
          }
          initialPos={{
            x: widgetPositions.assistant?.x ?? Math.max(260, window.innerWidth - 380),
            y: widgetPositions.assistant?.y ?? 85
          }}
          initialSize={{
            width: widgetPositions.assistant?.width ?? 330,
            height: widgetPositions.assistant?.height ?? 420
          }}
          zIndex={widgetZIndexes.assistant}
          onFocus={(): void => bringWidgetToFront('assistant')}
          onClose={(): void => handleToggleWidget('assistant')}
          onLayoutChange={(pos, size): void => handleWidgetLayoutChange('assistant', pos, size)}
        >
          <AssistantPanel />
        </FloatingWindow>
      )}

      {widgetState.stats && (
        <FloatingWindow
          id="stats"
          title="Document Stats & Outline"
          icon={<BarChart2 size={13} className="text-emerald-400" />}
          initialPos={{
            x: widgetPositions.stats?.x ?? 260,
            y: widgetPositions.stats?.y ?? 85
          }}
          initialSize={{
            width: widgetPositions.stats?.width ?? 290,
            height: widgetPositions.stats?.height ?? 340
          }}
          zIndex={widgetZIndexes.stats}
          onFocus={(): void => bringWidgetToFront('stats')}
          onClose={(): void => handleToggleWidget('stats')}
          onLayoutChange={(pos, size): void => handleWidgetLayoutChange('stats', pos, size)}
        >
          <DocumentStatsWidget
            content={activeFilePath ? fileContents[activeFilePath] || '' : ''}
            activeFileName={activeFilePath ? activeFilePath.split(/[\\/]/).pop() : undefined}
          />
        </FloatingWindow>
      )}

      {widgetState.terminal && (
        <FloatingWindow
          id="terminal"
          title="Quick Terminal"
          icon={<Terminal size={13} className="text-blue-400" />}
          initialPos={{
            x: widgetPositions.terminal?.x ?? Math.max(260, window.innerWidth - 480),
            y: widgetPositions.terminal?.y ?? Math.max(100, window.innerHeight - 270)
          }}
          initialSize={{
            width: widgetPositions.terminal?.width ?? 440,
            height: widgetPositions.terminal?.height ?? 220
          }}
          zIndex={widgetZIndexes.terminal}
          onFocus={(): void => bringWidgetToFront('terminal')}
          onClose={(): void => handleToggleWidget('terminal')}
          onLayoutChange={(pos, size): void => handleWidgetLayoutChange('terminal', pos, size)}
        >
          <QuickTerminalWidget />
        </FloatingWindow>
      )}

      {widgetState.snippets && (
        <FloatingWindow
          id="snippets"
          title="Code Snippets"
          icon={<Code2 size={13} className="text-amber-400" />}
          initialPos={{
            x: widgetPositions.snippets?.x ?? 320,
            y: widgetPositions.snippets?.y ?? 140
          }}
          initialSize={{
            width: widgetPositions.snippets?.width ?? 300,
            height: widgetPositions.snippets?.height ?? 340
          }}
          zIndex={widgetZIndexes.snippets}
          onFocus={(): void => bringWidgetToFront('snippets')}
          onClose={(): void => handleToggleWidget('snippets')}
          onLayoutChange={(pos, size): void => handleWidgetLayoutChange('snippets', pos, size)}
        >
          <CodeSnippetsWidget onInsertSnippet={onInsertSnippet} />
        </FloatingWindow>
      )}
    </>
  )
}

export default React.memo(FloatingWidgetsOverlayComponent)
