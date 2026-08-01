export interface MarkdownMetadata {
  icon?: string
  banner?: string
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
