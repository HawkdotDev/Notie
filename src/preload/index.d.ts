import { ElectronAPI } from '@electron-toolkit/preload'

interface FileNode {
  name: string
  path: string
  isDir: boolean
}

interface FileSystemAPI {
  openDirectory(): Promise<{ path: string; name: string } | null>
  readDirectory(dirPath: string): Promise<FileNode[]>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  createFile(parentPath: string, name: string): Promise<string>
  createFolder(parentPath: string, name: string): Promise<string>
  deletePath(itemPath: string): Promise<void>
  renamePath(oldPath: string, newPath: string): Promise<void>
  showSaveDialog(defaultName: string): Promise<string | null>
  watchDirectory(dirPath: string): Promise<void>
  closeWatcher(): Promise<void>
  getGraphData(dirPath: string): Promise<{
    nodes: Array<{ id: string; name: string }>
    links: Array<{ source: string; target: string }>
  }>
  onWorkspaceChanged(
    callback: (data: {
      eventType: string
      filename: string
      absolutePath: string
      parentPath: string
    }) => void
  ): () => void
}

interface WindowAPI {
  minimize(): void
  maximize(): void
  close(): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fs: FileSystemAPI
      window: WindowAPI
    }
  }
}
