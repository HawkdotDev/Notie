import React, { useState, useEffect, useCallback, useRef } from 'react'
// import MonacoEditor from '@monaco-editor/react'
import { FolderOpen, FileCode, Cpu } from 'lucide-react'
import FileTree from './components/FileTree'
import BlockEditor from './components/BlockEditor'
// import TabBar from './components/TabBar'

interface OpenFile {
  name: string
  path: string
}

function getLanguageFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'md':
      return 'markdown'
    case 'py':
      return 'python'
    case 'go':
      return 'go'
    case 'rs':
      return 'rust'
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'h':
    case 'hpp':
      return 'cpp'
    case 'c':
      return 'c'
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'sh':
    case 'bash':
      return 'shell'
    case 'xml':
      return 'xml'
    case 'sql':
      return 'sql'
    default:
      return 'plaintext'
  }
}

export default function App(): React.JSX.Element {
  // Workspace State
  const [workspacePath, setWorkspacePath] = useState<string | null>(
    localStorage.getItem('workspacePath')
  )
  const [workspaceName, setWorkspaceName] = useState<string>(
    localStorage.getItem('workspaceName') || ''
  )

  // Tabs / Active File State
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  // Content tracking (for undo/redo and unsaved state comparison)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [originalFileContents, setOriginalFileContents] = useState<Record<string, string>>({})
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [activeFileTitle, setActiveFileTitle] = useState('')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(
    localStorage.getItem('autoSaveEnabled') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('autoSaveEnabled', String(autoSaveEnabled))
  }, [autoSaveEnabled])

  const activeFilePathRef = useRef<string | null>(null)
  const fileContentsRef = useRef<Record<string, string>>({})
  const originalFileContentsRef = useRef<Record<string, string>>({})
  const lastSavedContentsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    activeFilePathRef.current = activeFilePath
  }, [activeFilePath])

  useEffect(() => {
    fileContentsRef.current = fileContents
  }, [fileContents])

  useEffect(() => {
    originalFileContentsRef.current = originalFileContents
  }, [originalFileContents])

  const closeTabDirectly = useCallback((filePath: string): void => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== filePath)
      if (activeFilePathRef.current === filePath) {
        if (filtered.length > 0) {
          setActiveFilePath(filtered[filtered.length - 1].path)
        } else {
          setActiveFilePath(null)
        }
      }
      return filtered
    })

    setFileContents((prev) => {
      const copy = { ...prev }
      delete copy[filePath]
      return copy
    })
    setOriginalFileContents((prev) => {
      const copy = { ...prev }
      delete copy[filePath]
      return copy
    })
  }, [])

  const handleTitleBlur = useCallback(async (): Promise<void> => {
    if (!activeFilePath || !activeFileTitle.trim()) return

    const baseName = activeFilePath.split(/[\\/]/).pop() || 'Untitled'
    const nameWithoutExtension = baseName.replace(/\.[^/.]+$/, '')

    if (activeFileTitle.trim() === nameWithoutExtension) return

    const ext = baseName.split('.').pop() || 'txt'
    const separator = activeFilePath.includes('/') ? '/' : '\\'
    const parentDir = activeFilePath.substring(0, activeFilePath.lastIndexOf(separator))

    const newName = `${activeFileTitle.trim()}.${ext}`
    const newPath = parentDir + separator + newName

    try {
      await window.api.fs.renamePath(activeFilePath, newPath)

      setOpenFiles((prev) =>
        prev.map((f) => (f.path === activeFilePath ? { name: newName, path: newPath } : f))
      )

      setFileContents((prev) => {
        const copy = { ...prev }
        copy[newPath] = copy[activeFilePath]
        delete copy[activeFilePath]
        return copy
      })
      setOriginalFileContents((prev) => {
        const copy = { ...prev }
        copy[newPath] = copy[activeFilePath]
        delete copy[activeFilePath]
        return copy
      })

      setActiveFilePath(newPath)
    } catch (err) {
      alert(`Error renaming file: ${err}`)
      setActiveFileTitle(nameWithoutExtension)
    }
  }, [activeFilePath, activeFileTitle])

  // Sync workspace selection to localstorage
  const handleOpenWorkspace = useCallback(async (): Promise<void> => {
    try {
      const result = await window.api.fs.openDirectory()
      if (result) {
        setWorkspacePath(result.path)
        setWorkspaceName(result.name)
        localStorage.setItem('workspacePath', result.path)
        localStorage.setItem('workspaceName', result.name)
        // Clear old workspace tabs
        setOpenFiles([])
        setActiveFilePath(null)
      }
    } catch (err) {
      console.error('Failed to open workspace directory:', err)
    }
  }, [])

  const handleCloseWorkspace = (): void => {
    setWorkspacePath(null)
    setWorkspaceName('')
    localStorage.removeItem('workspacePath')
    localStorage.removeItem('workspaceName')
    setOpenFiles([])
    setActiveFilePath(null)
  }

  // Open a file from the tree
  const handleFileSelect = useCallback(
    async (filePath: string): Promise<void> => {
      // If already open, just switch active tab
      const alreadyOpen = openFiles.find((f) => f.path === filePath)
      if (alreadyOpen) {
        setActiveFilePath(filePath)
        setCursorPosition({ line: 1, column: 1 })
        const titleWithoutExt = alreadyOpen.name.replace(/\.[^/.]+$/, '')
        setActiveFileTitle(titleWithoutExt)
        return
      }

      try {
        const content = await window.api.fs.readFile(filePath)
        const name = filePath.split(/[\\/]/).pop() || 'Untitled'
        const titleWithoutExt = name.replace(/\.[^/.]+$/, '')

        setOpenFiles((prev) => [...prev, { name, path: filePath }])
        setFileContents((prev) => ({ ...prev, [filePath]: content }))
        setOriginalFileContents((prev) => ({ ...prev, [filePath]: content }))
        setActiveFilePath(filePath)
        setActiveFileTitle(titleWithoutExt)
        setCursorPosition({ line: 1, column: 1 })
      } catch (err) {
        alert(`Error reading file: ${err}`)
      }
    },
    [openFiles]
  )

  // Handle Tab Switch
  // const handleTabSelect = (filePath: string): void => {
  //   setActiveFilePath(filePath)
  //   setCursorPosition({ line: 1, column: 1 })
  //   const baseName = filePath.split(/[\\/]/).pop() || 'Untitled'
  //   setActiveFileTitle(baseName.replace(/\.[^/.]+$/, ''))
  // }

  // Close Tab with unsaved check
  const handleTabClose = useCallback(
    (filePath: string): void => {
      const isUnsaved = fileContents[filePath] !== originalFileContents[filePath]
      if (isUnsaved) {
        const confirmClose = confirm(
          'You have unsaved changes. Are you sure you want to close this file?'
        )
        if (!confirmClose) return
      }

      setOpenFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== filePath)
        // Handle active file transition
        if (activeFilePath === filePath) {
          if (filtered.length > 0) {
            setActiveFilePath(filtered[filtered.length - 1].path)
          } else {
            setActiveFilePath(null)
          }
        }
        return filtered
      })

      // Clean up content cache
      setFileContents((prev) => {
        const copy = { ...prev }
        delete copy[filePath]
        return copy
      })
      setOriginalFileContents((prev) => {
        const copy = { ...prev }
        delete copy[filePath]
        return copy
      })
    },
    [fileContents, originalFileContents, activeFilePath]
  )

  // Save active file
  const handleSaveActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath) return
    const content = fileContents[activeFilePath] || ''
    try {
      await window.api.fs.writeFile(activeFilePath, content)
      lastSavedContentsRef.current[activeFilePath] = content
      setOriginalFileContents((prev) => ({ ...prev, [activeFilePath]: content }))
    } catch (err) {
      alert(`Error saving file: ${err}`)
    }
  }, [activeFilePath, fileContents])

  // Create new file at workspace root helper
  const handleCreateFileAtRoot = useCallback(async (): Promise<void> => {
    if (!workspacePath) return
    const name = prompt('Enter new file name:')
    if (!name || !name.trim()) return
    try {
      const newPath = await window.api.fs.createFile(workspacePath, name.trim())
      handleFileSelect(newPath)
    } catch (err) {
      alert(`Error creating file: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  // Manage directory watcher lifecycle and handle changes
  useEffect(() => {
    if (!workspacePath) {
      window.api.fs.closeWatcher()
      return
    }

    // Start watching the workspace directory in main process
    window.api.fs.watchDirectory(workspacePath)

    // Listen for file changes
    const unsubscribe = window.api.fs.onWorkspaceChanged(async (data) => {
      const activePath = activeFilePathRef.current

      // If the changed file is the one currently open in our editor:
      if (activePath === data.absolutePath) {
        try {
          const contentOnDisk = await window.api.fs.readFile(data.absolutePath)

          // If the disk changes match our own save, sync original contents state and ignore
          if (contentOnDisk === lastSavedContentsRef.current[activePath]) {
            setOriginalFileContents((prev) => ({ ...prev, [activePath]: contentOnDisk }))
            return
          }

          const currentVal = fileContentsRef.current[activePath] || ''
          const originalVal = originalFileContentsRef.current[activePath] || ''
          const isDirty = currentVal !== originalVal

          if (!isDirty) {
            // If the local file is not dirty, silently update it with external changes
            if (currentVal !== contentOnDisk) {
              setFileContents((prev) => ({ ...prev, [activePath]: contentOnDisk }))
              setOriginalFileContents((prev) => ({ ...prev, [activePath]: contentOnDisk }))
            }
          } else {
            // If it is dirty, ask the user if they want to overwrite their changes
            if (originalVal !== contentOnDisk && currentVal !== contentOnDisk) {
              const reload = confirm(
                `The file "${data.filename}" has been modified externally. Do you want to reload it and discard your local unsaved changes?`
              )
              if (reload) {
                setFileContents((prev) => ({ ...prev, [activePath]: contentOnDisk }))
                setOriginalFileContents((prev) => ({ ...prev, [activePath]: contentOnDisk }))
              }
            }
          }
        } catch (err: unknown) {
          const error = err as { message?: string; code?: string }
          // If file read failed with ENOENT or similar, it was deleted externally
          if (
            error &&
            ((error.message && error.message.includes('ENOENT')) || error.code === 'ENOENT')
          ) {
            alert(`The file "${data.filename}" was deleted externally. Closing editor tab.`)
            closeTabDirectly(data.absolutePath)
          } else {
            console.error('Failed to read externally modified file:', err)
          }
        }
      }
    })

    return (): void => {
      unsubscribe()
      window.api.fs.closeWatcher()
    }
  }, [workspacePath, closeTabDirectly])

  // Autosave effect (debounced)
  useEffect(() => {
    if (!autoSaveEnabled || !activeFilePath) return

    const currentVal = fileContents[activeFilePath]
    const originalVal = originalFileContents[activeFilePath]

    // Only save if there are unsaved changes
    if (currentVal === undefined || currentVal === originalVal) return

    const timer = setTimeout(async () => {
      try {
        await window.api.fs.writeFile(activeFilePath, currentVal)
        lastSavedContentsRef.current[activeFilePath] = currentVal
        setOriginalFileContents((prev) => ({ ...prev, [activeFilePath]: currentVal }))
      } catch (err) {
        console.error('Autosave failed:', err)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [fileContents, activeFilePath, autoSaveEnabled, originalFileContents])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveActiveFile()
      }

      // Ctrl + O (Open Folder)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleOpenWorkspace()
      }

      // Ctrl + W (Close active file)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeFilePath) {
          handleTabClose(activeFilePath)
        }
      }

      // Ctrl + N (Create file at root)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (workspacePath) {
          handleCreateFileAtRoot()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [
    workspacePath,
    activeFilePath,
    handleSaveActiveFile,
    handleOpenWorkspace,
    handleTabClose,
    handleCreateFileAtRoot
  ])

  // Track unsaved file changes
  const activeUnsaved = activeFilePath
    ? fileContents[activeFilePath] !== originalFileContents[activeFilePath]
    : false

  // Unsaved files registry
  const unsavedFiles: Record<string, boolean> = {}
  openFiles.forEach((f) => {
    unsavedFiles[f.path] = fileContents[f.path] !== originalFileContents[f.path]
  })

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <div className="sidebar">
        {/* <div className="sidebar-header">
        </div> */}
        <div
          className="sidebar-content"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px 4px' }}
        >
          {workspacePath ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <FileTree
                  rootPath={workspacePath}
                  rootName={workspaceName}
                  activeFilePath={activeFilePath}
                  onFileSelect={handleFileSelect}
                />
              </div>
              <div
                style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                {/* <button
                  className="primary-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={handleCreateFileAtRoot}
                >
                  <span>+ New Page</span>
                </button> */}
                <button
                  className="primary-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)'
                  }}
                  onClick={handleCloseWorkspace}
                  onMouseEnter={(e): void => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    e.currentTarget.style.color = 'var(--text-main)'
                  }}
                  onMouseLeave={(e): void => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <span>Close Workspace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen size={40} className="empty-state-icon" />
              <div className="empty-state-title">No Folder Open</div>
              <div className="empty-state-text">
                Open a folder to visualize project structure and start editing code files.
              </div>
              <button className="primary-btn" onClick={handleOpenWorkspace}>
                <FolderOpen size={14} />
                <span>Open Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor & Content Pane */}
      <div className="editor-workspace">
        {activeFilePath && (
          <div className="editor-top-nav">
            <div className="nav-breadcrumbs">
              <span>{workspaceName}</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>
                {activeFilePath
                  .replace(workspacePath || '', '')
                  .replace(/^[\\/]/, '')
                  .split(/[\\/]/)
                  .join('  /  ')}
              </span>
            </div>
            <div
              className="nav-actions"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  marginRight: '8px'
                }}
              >
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e): void => setAutoSaveEnabled(e.target.checked)}
                  style={{
                    accentColor: 'var(--text-active)',
                    cursor: 'pointer',
                    width: '12px',
                    height: '12px'
                  }}
                />
                <span>Autosave</span>
              </label>
              {activeUnsaved ? (
                <>
                  <span className="save-status-unsaved">Unsaved changes</span>
                  <button
                    className="primary-btn"
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--accent-color)',
                      border: 'none',
                      height: '24px',
                      lineHeight: '14px'
                    }}
                    onClick={handleSaveActiveFile}
                  >
                    Save Page
                  </button>
                </>
              ) : (
                <span className="save-status-saved">Saved</span>
              )}
            </div>
          </div>
        )}

        {activeFilePath ? (
          <div className="editor-container">
            <div className="editor-wrapper">
              <input
                className="document-title-input"
                type="text"
                value={activeFileTitle}
                onChange={(e): void => setActiveFileTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Untitled"
              />
              <BlockEditor
                value={fileContents[activeFilePath] || ''}
                onChange={(value): void => {
                  if (activeFilePath) {
                    setFileContents((prev) => ({ ...prev, [activeFilePath]: value }))
                  }
                }}
                activeFilePath={activeFilePath}
              />
            </div>
          </div>
        ) : (
          <div className="welcome-workspace">
            <div className="welcome-logo">Notie</div>
            <div className="welcome-shortcuts">
              <div className="shortcut-row">
                <span>Open Folder</span>
                <span className="shortcut-key">Ctrl + O</span>
              </div>
              {workspacePath && (
                <div className="shortcut-row">
                  <span>Create File</span>
                  <span className="shortcut-key">Ctrl + N</span>
                </div>
              )}
              <div className="shortcut-row">
                <span>Save File</span>
                <span className="shortcut-key">Ctrl + S</span>
              </div>
              <div className="shortcut-row">
                <span>Close Tab</span>
                <span className="shortcut-key">Ctrl + W</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            {workspacePath ? (
              <div className="status-item">
                <Cpu size={12} />
                <span>{workspaceName}</span>
              </div>
            ) : (
              <span>Offline Workspace</span>
            )}
            {activeFilePath && (
              <div className="status-item">
                <FileCode size={12} />
                <span>
                  {activeFilePath.split(/[\\/]/).pop()}
                  {activeUnsaved && ' (Unsaved)'}
                </span>
              </div>
            )}
          </div>

          <div className="status-right">
            {activeFilePath && (
              <>
                <div className="status-item">
                  <span>
                    Ln {cursorPosition.line}, Col {cursorPosition.column}
                  </span>
                </div>
                <div className="status-item">
                  <span>UTF-8</span>
                </div>
                <div className="status-item">
                  <span style={{ textTransform: 'uppercase' }}>
                    {getLanguageFromExtension(activeFilePath)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple internal icon to close workspaces
// function XButton(): React.JSX.Element {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="14"
//       height="14"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <line x1="18" y1="6" x2="6" y2="18"></line>
//       <line x1="6" y1="6" x2="18" y2="18"></line>
//     </svg>
//   )
// }
