import { app, shell, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron'
import { join, basename, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as fs from 'fs/promises'
import { watch, type FSWatcher } from 'fs'

let workspaceWatcher: FSWatcher | null = null

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: false, // Keep menu bar visible as requested
    backgroundColor: '#0f0f0f', // Matches our theme background color to avoid flashing
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Force dark mode for native titlebar, menus, and system dialogs to blend the separator line
  nativeTheme.themeSource = 'dark'
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // File System IPC handlers
  ipcMain.handle('fs:openDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    const dirPath = result.filePaths[0]
    return {
      path: dirPath,
      name: basename(dirPath)
    }
  })

  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .map((entry) => ({
          name: entry.name,
          path: join(dirPath, entry.name),
          isDir: entry.isDirectory()
        }))
        .sort((a, b) => {
          if (a.isDir && !b.isDir) return -1
          if (!a.isDir && b.isDir) return 1
          return a.name.localeCompare(b.name)
        })
    } catch (error) {
      console.error(`Failed to read directory: ${dirPath}`, error)
      throw error
    }
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    return await fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('fs:createFile', async (_, parentPath: string, name: string) => {
    const filePath = join(parentPath, name)
    await fs.writeFile(filePath, '', 'utf-8')
    return filePath
  })

  ipcMain.handle('fs:createFolder', async (_, parentPath: string, name: string) => {
    const folderPath = join(parentPath, name)
    await fs.mkdir(folderPath, { recursive: true })
    return folderPath
  })

  ipcMain.handle('fs:deletePath', async (_, itemPath: string) => {
    await fs.rm(itemPath, { recursive: true, force: true })
  })

  ipcMain.handle('fs:renamePath', async (_, oldPath: string, newPath: string) => {
    await fs.rename(oldPath, newPath)
  })

  ipcMain.handle('fs:showSaveDialog', async (event, defaultName: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showSaveDialog(window, {
      defaultPath: defaultName
    })
    if (result.canceled || !result.filePath) {
      return null
    }
    return result.filePath
  })

  ipcMain.handle('fs:watchDirectory', async (event, dirPath: string) => {
    if (workspaceWatcher) {
      workspaceWatcher.close()
      workspaceWatcher = null
    }

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return

    try {
      workspaceWatcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return

        // Filter out typical ignored directories/files to optimize performance
        if (
          filename.includes('node_modules') ||
          filename.includes('.git') ||
          filename.includes('.eslintcache') ||
          filename.includes('.DS_Store')
        ) {
          return
        }

        const absolutePath = join(dirPath, filename)
        const parentPath = dirname(absolutePath)
        window.webContents.send('workspace:changed', {
          eventType,
          filename,
          absolutePath,
          parentPath
        })
      })
    } catch (error) {
      console.error('Failed to start directory watcher:', error)
    }
  })

  ipcMain.handle('fs:closeWatcher', async () => {
    if (workspaceWatcher) {
      workspaceWatcher.close()
      workspaceWatcher = null
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
