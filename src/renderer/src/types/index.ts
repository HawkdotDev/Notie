export interface MarkdownMetadata {
  icon?: string
  banner?: string
  showIcon?: boolean
  showCover?: boolean
  showFileName?: boolean
}

export interface ParsedDocument {
  metadata: MarkdownMetadata
  content: string
  title: string
}

export interface OpenFileInfo {
  path: string
  name: string
}

export interface FileNode {
  name: string
  path: string
  isDir: boolean
}

export interface ContextMenuState {
  x: number
  y: number
  path: string
  isDir: boolean
  parentPath: string
}

export type ViewMode = 'editor' | 'graph'

export type TerminalTabType = 'PROBLEMS' | 'OUTPUT' | 'TERMINAL' | 'DEBUG CONSOLE'

export interface StatusStatsConfig {
  showWords: boolean
  showLines: boolean
  showChars: boolean
  showSpaces: boolean
  showReadingTime: boolean
  showLanguage: boolean
  showSavedBadge: boolean
}

export interface WidgetState {
  assistant: boolean
  stats: boolean
  terminal: boolean
  snippets: boolean
  outline: boolean
}

export interface WidgetLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface PersistentAppState {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  openFiles: OpenFileInfo[]
  viewMode: ViewMode
  autoSaveEnabled: boolean
  sidebarCollapsed: boolean
  sidebarWidth: number
  showRightSidebar: boolean
  rightSidebarWidth: number
  showSearchInput: boolean
  showDiffToggle?: boolean
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  searchQuery: string
  widgetState: WidgetState
  widgetZIndexes: Record<string, number>
  widgetPositions: Record<string, WidgetLayout>
}
