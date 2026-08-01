import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  fs: {
    openDirectory: (): Promise<{ path: string; name: string } | null> =>
      ipcRenderer.invoke('fs:openDirectory'),
    readDirectory: (
      dirPath: string
    ): Promise<Array<{ name: string; path: string; isDir: boolean }>> =>
      ipcRenderer.invoke('fs:readDirectory', dirPath),
    readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke('fs:writeFile', filePath, content),
    createFile: (parentPath: string, name: string): Promise<string> =>
      ipcRenderer.invoke('fs:createFile', parentPath, name),
    createFolder: (parentPath: string, name: string): Promise<string> =>
      ipcRenderer.invoke('fs:createFolder', parentPath, name),
    deletePath: (itemPath: string): Promise<void> => ipcRenderer.invoke('fs:deletePath', itemPath),
    renamePath: (oldPath: string, newPath: string): Promise<void> =>
      ipcRenderer.invoke('fs:renamePath', oldPath, newPath),
    showSaveDialog: (defaultName: string): Promise<string | null> =>
      ipcRenderer.invoke('fs:showSaveDialog', defaultName),
    watchDirectory: (dirPath: string): Promise<void> =>
      ipcRenderer.invoke('fs:watchDirectory', dirPath),
    closeWatcher: (): Promise<void> => ipcRenderer.invoke('fs:closeWatcher'),
    getGraphData: (
      dirPath: string
    ): Promise<{
      nodes: Array<{ id: string; name: string }>
      links: Array<{ source: string; target: string }>
    }> => ipcRenderer.invoke('fs:getGraphData', dirPath),
    onWorkspaceChanged: (
      callback: (data: {
        eventType: string
        filename: string
        absolutePath: string
        parentPath: string
      }) => void
    ): (() => void) => {
      const listener = (
        _event: unknown,
        data: {
          eventType: string
          filename: string
          absolutePath: string
          parentPath: string
        }
      ): void => callback(data)
      ipcRenderer.on('workspace:changed', listener)
      return (): void => {
        ipcRenderer.removeListener('workspace:changed', listener)
      }
    }
  },
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
