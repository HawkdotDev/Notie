import React, { useState, useEffect, useCallback, useRef } from 'react'
import BlockEditor from './components/BlockEditor'
import EmojiPicker from './components/EmojiPicker'
import BannerPicker from './components/BannerPicker'
import GraphView from './components/GraphView'
import WelcomeScreen from './components/WelcomeScreen'
import TopHeader from './components/layout/TopHeader'
import SubHeader, { WidgetState } from './components/layout/SubHeader'
import Sidebar from './components/layout/Sidebar'
import AssistantPanel from './components/layout/AssistantPanel'
import DocumentStatsWidget from './components/layout/DocumentStatsWidget'
import QuickTerminalWidget from './components/layout/QuickTerminalWidget'
import CodeSnippetsWidget from './components/layout/CodeSnippetsWidget'
import FloatingWindow from './components/layout/FloatingWindow'
import StatusBar from './components/layout/StatusBar'
import { Terminal, Globe, FileText, Sparkles, BarChart2, Code2 } from 'lucide-react'

import { MarkdownMetadata, OpenFileInfo, ViewMode } from './types'
import { normalizePath, getRelativePath } from './utils/pathUtils'
import { parseMarkdownMetadata, serializeMarkdownMetadata } from './utils/metadataUtils'

export default function App(): React.JSX.Element {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string>('')
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  const [openFiles, setOpenFiles] = useState<OpenFileInfo[]>([])
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [originalFileContents, setOriginalFileContents] = useState<Record<string, string>>({})

  const [fileIcons, setFileIcons] = useState<Record<string, string>>({})
  const [fileBanners, setFileBanners] = useState<Record<string, string>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)

  const [viewMode, setViewMode] = useState<ViewMode>('editor')

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true)
  const [cursorPosition] = useState<{ line: number; column: number }>({
    line: 12,
    column: 6
  })

  // Sidebar collapse & resize state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(240)
  const isResizingRef = useRef<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // State toggles for screenshot-matching UI
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)
  const [showDiffToggle, setShowDiffToggle] = useState<boolean>(false)
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(false)
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(220)
  const isResizingRightRef = useRef<boolean>(false)
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false)
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false)

  // Floating Widgets State
  const [widgetState, setWidgetState] = useState<WidgetState>({
    assistant: true,
    stats: false,
    terminal: false,
    snippets: false
  })

  const [widgetZIndexes, setWidgetZIndexes] = useState<Record<string, number>>({
    assistant: 100,
    stats: 101,
    terminal: 102,
    snippets: 103
  })

  const bringWidgetToFront = useCallback((id: string) => {
    setWidgetZIndexes((prev) => {
      const currentMax = Math.max(...Object.values(prev), 100)
      return { ...prev, [id]: currentMax + 1 }
    })
  }, [])

  const handleToggleWidget = useCallback(
    (id: keyof WidgetState) => {
      setWidgetState((prev) => {
        const nextVal = !prev[id]
        if (nextVal) {
          bringWidgetToFront(id)
        }
        return { ...prev, [id]: nextVal }
      })
    },
    [bringWidgetToFront]
  )

  // Workspace initialization
  useEffect(() => {
    // Workspace init
  }, [])

  const startResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingRef.current = true
    setIsResizingLeft(true)

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingRef.current) return
      const newWidth = Math.max(160, Math.min(450, moveEvent.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = (): void => {
      isResizingRef.current = false
      setIsResizingLeft(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const startRightResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingRightRef.current = true
    setIsResizingRight(true)

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingRightRef.current) return
      const newWidth = Math.max(160, Math.min(400, window.innerWidth - moveEvent.clientX))
      setRightSidebarWidth(newWidth)
    }

    const handleMouseUp = (): void => {
      isResizingRightRef.current = false
      setIsResizingRight(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Recent workspaces state
  const [recentWorkspaces, setRecentWorkspaces] = useState<{ path: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('recentWorkspaces')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return [
      { path: 'c:\\Users\\dwaip\\OneDrive\\Documents\\Application', name: 'Application' },
      { path: '/workspace', name: 'workspace' }
    ]
  })

  const updateRecentWorkspaces = useCallback((path: string, name?: string) => {
    const norm = normalizePath(path)
    const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
    setRecentWorkspaces((prev) => {
      const filtered = prev.filter((item) => normalizePath(item.path) !== norm)
      const updated = [{ path: norm, name: folderName }, ...filtered].slice(0, 10)
      try {
        localStorage.setItem('recentWorkspaces', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleOpenWorkspace = useCallback(async (): Promise<void> => {
    try {
      const selected = await window.api.fs.openDirectory()
      if (selected && selected.path) {
        const norm = normalizePath(selected.path)
        const folderName = selected.name || norm.split(/[\\/]/).pop() || 'Workspace'
        setWorkspacePath(norm)
        setWorkspaceName(folderName)
        setActiveFilePath(null)
        setOpenFiles([])
        setFileContents({})
        setOriginalFileContents({})
        setFileIcons({})
        setFileBanners({})
        updateRecentWorkspaces(norm, folderName)
      }
    } catch (err) {
      console.error('Error opening folder:', err)
    }
  }, [updateRecentWorkspaces])

  const handleSwitchWorkspace = useCallback(
    (path: string, name?: string): void => {
      const norm = normalizePath(path)
      if (!norm) return
      const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
      setWorkspacePath(norm)
      setWorkspaceName(folderName)
      setActiveFilePath(null)
      setOpenFiles([])
      setFileContents({})
      setOriginalFileContents({})
      setFileIcons({})
      setFileBanners({})
      updateRecentWorkspaces(norm, folderName)
    },
    [updateRecentWorkspaces]
  )

  const handleRemoveRecentWorkspace = useCallback((path: string): void => {
    const norm = normalizePath(path)
    setRecentWorkspaces((prev) => {
      const updated = prev.filter((item) => normalizePath(item.path) !== norm)
      try {
        localStorage.setItem('recentWorkspaces', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleCloseWorkspace = async (): Promise<void> => {
    try {
      setWorkspacePath(null)
      setWorkspaceName('')
      setActiveFilePath(null)
      setOpenFiles([])
      setFileContents({})
      setOriginalFileContents({})
      setFileIcons({})
      setFileBanners({})
    } catch (err) {
      console.error('Error closing workspace:', err)
    }
  }

  const loadFileContent = useCallback(
    async (filePath: string): Promise<string> => {
      const normPath = normalizePath(filePath)
      if (!normPath) return ''

      if (fileContents[normPath] !== undefined) {
        return fileContents[normPath]
      }
      try {
        const content = await window.api.fs.readFile(normPath)
        setFileContents((prev) => ({ ...prev, [normPath]: content }))
        setOriginalFileContents((prev) => ({ ...prev, [normPath]: content }))

        if (normPath.endsWith('.md')) {
          const parsed = parseMarkdownMetadata(content)
          const rel = getRelativePath(normPath, workspacePath)
          if (parsed.metadata.icon) {
            setFileIcons((prev) => ({ ...prev, [rel.toLowerCase()]: parsed.metadata.icon! }))
          }
          if (parsed.metadata.banner) {
            setFileBanners((prev) => ({ ...prev, [rel.toLowerCase()]: parsed.metadata.banner! }))
          }
        }
        return content
      } catch (err) {
        console.error(`Failed to read file ${normPath}:`, err)
        return ''
      }
    },
    [fileContents, workspacePath]
  )

  const handleFileSelect = useCallback(
    async (filePath: string): Promise<void> => {
      const normPath = normalizePath(filePath)
      if (!normPath) return

      const fileName = normPath.split(/[\\/]/).pop() || ''
      setActiveFilePath(normPath)

      setOpenFiles((prev) => {
        if (prev.some((f) => f.path === normPath)) return prev
        return [...prev, { path: normPath, name: fileName }]
      })

      await loadFileContent(normPath)
    },
    [loadFileContent]
  )

  const handleTabSelect = (filePath: string): void => {
    setActiveFilePath(normalizePath(filePath))
  }

  const handleTabClose = useCallback(
    (filePath: string): void => {
      const normPath = normalizePath(filePath)
      if (!normPath) return

      setOpenFiles((prev) => {
        const updated = prev.filter((f) => f.path !== normPath)
        if (activeFilePath === normPath) {
          if (updated.length > 0) {
            setActiveFilePath(updated[updated.length - 1].path)
          } else {
            setActiveFilePath(null)
          }
        }
        return updated
      })
    },
    [activeFilePath]
  )

  const handleSaveActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath) return
    const normPath = normalizePath(activeFilePath)
    if (!normPath) return

    let contentToSave = fileContents[normPath] ?? ''
    if (normPath.endsWith('.md')) {
      const rel = getRelativePath(normPath, workspacePath)
      const metadata: MarkdownMetadata = {
        icon: fileIcons[rel.toLowerCase()],
        banner: fileBanners[rel.toLowerCase()]
      }
      contentToSave = serializeMarkdownMetadata(contentToSave, metadata)
    }

    try {
      await window.api.fs.writeFile(normPath, contentToSave)
      setOriginalFileContents((prev) => ({ ...prev, [normPath]: fileContents[normPath] ?? '' }))
    } catch (err) {
      alert(`Error saving file: ${err}`)
    }
  }, [activeFilePath, fileContents, fileIcons, fileBanners, workspacePath])

  // Autosave effect
  useEffect(() => {
    if (!autoSaveEnabled || !activeFilePath) return

    const normPath = normalizePath(activeFilePath)
    if (!normPath) return

    const current = fileContents[normPath]
    const original = originalFileContents[normPath]
    if (current === undefined || current === original) return

    const timer = setTimeout(() => {
      void handleSaveActiveFile()
    }, 1500)

    return (): void => clearTimeout(timer)
  }, [fileContents, originalFileContents, activeFilePath, autoSaveEnabled, handleSaveActiveFile])

  const handleMetadataLoaded = useCallback(
    (filePath: string, metadata: MarkdownMetadata): void => {
      const rel = getRelativePath(filePath, workspacePath)
      if (metadata.icon) {
        setFileIcons((prev) => ({ ...prev, [rel.toLowerCase()]: metadata.icon! }))
      }
      if (metadata.banner) {
        setFileBanners((prev) => ({ ...prev, [rel.toLowerCase()]: metadata.banner! }))
      }
    },
    [workspacePath]
  )

  const handleCreateFileAtRoot = useCallback(async (): Promise<void> => {
    if (!workspacePath) {
      alert('Please open a workspace folder first.')
      return
    }
    const name = prompt('Enter new file name:')
    if (!name || !name.trim()) return

    const fileName = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`
    try {
      const newPath = await window.api.fs.createFile(workspacePath, fileName)
      await handleFileSelect(newPath)
    } catch (err) {
      alert(`Error creating file: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  const handleWikilinkClick = useCallback(
    async (targetName: string): Promise<void> => {
      if (!workspacePath) return
      const cleanName = targetName.replace(/^\[\[|\]\]$/g, '').trim()
      const targetFileName = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`

      try {
        const targetPath = `${workspacePath}/${targetFileName}`
        const normPath = normalizePath(targetPath)!
        let exists = false
        try {
          await window.api.fs.readFile(normPath)
          exists = true
        } catch {
          exists = false
        }

        if (exists) {
          await handleFileSelect(normPath)
        } else {
          const create = confirm(
            `File "${targetFileName}" does not exist. Would you like to create it?`
          )
          if (create) {
            const newPath = await window.api.fs.createFile(workspacePath, targetFileName)
            await handleFileSelect(newPath)
          }
        }
      } catch (err) {
        console.error('Error navigating wikilink:', err)
      }
    },
    [workspacePath, handleFileSelect]
  )

  // Keyboard Shortcuts (Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault()
          void handleSaveActiveFile()
        } else if (e.key.toLowerCase() === 'o') {
          e.preventDefault()
          void handleOpenWorkspace()
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault()
          void handleCreateFileAtRoot()
        } else if (e.key.toLowerCase() === 'w') {
          e.preventDefault()
          if (activeFilePath) {
            handleTabClose(activeFilePath)
          }
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

  const activeFileIcon = activeFilePath
    ? fileIcons[getRelativePath(activeFilePath, workspacePath)]
    : undefined
  const activeFileBanner = activeFilePath
    ? fileBanners[getRelativePath(activeFilePath, workspacePath)]
    : undefined

  return (
    <div className="app-container">
      {/* ====== 1. TOP WINDOW TITLEBAR ====== */}
      <TopHeader
        workspacePath={workspacePath}
        workspaceName={workspaceName}
        activeFilePath={activeFilePath}
      />

      {/* ====== 2. SUB-HEADER QUICK ACTIONS BAR ====== */}
      <SubHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={(): void => setSidebarCollapsed((p) => !p)}
        onSaveActiveFile={handleSaveActiveFile}
        viewMode={viewMode}
        onToggleViewMode={(): void => setViewMode((m) => (m === 'graph' ? 'editor' : 'graph'))}
        onOpenWorkspace={handleOpenWorkspace}
        onCreateFileAtRoot={handleCreateFileAtRoot}
        showDiffToggle={showDiffToggle}
        onToggleDiff={(): void => setShowDiffToggle((prev) => !prev)}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
        activeUnsaved={activeUnsaved}
        widgetState={widgetState}
        onToggleWidget={handleToggleWidget}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={(): void => setShowRightSidebar((p) => !p)}
      />

      {/* ====== 3. MAIN APP CONTENT CONTAINER ====== */}
      <div className="app-main">
        {/* Sidebar Panel */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          sidebarWidth={sidebarWidth}
          isResizing={isResizingLeft}
          workspacePath={workspacePath}
          workspaceName={workspaceName}
          recentWorkspaces={recentWorkspaces}
          activeFilePath={activeFilePath}
          openFiles={openFiles}
          onFileSelect={handleFileSelect}
          onCreateFileAtRoot={handleCreateFileAtRoot}
          onOpenWorkspace={handleOpenWorkspace}
          onCloseWorkspace={handleCloseWorkspace}
          onSwitchWorkspace={handleSwitchWorkspace}
          onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
          onToggleSidebar={(): void => setSidebarCollapsed((p) => !p)}
          showSearchInput={showSearchInput}
          onToggleSearchInput={(): void => setShowSearchInput((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fileIcons={fileIcons}
          onMetadataLoaded={handleMetadataLoaded}
          onStartResize={startResize}
        />

        {/* Editor Workspace & Split Area */}
        <div className="editor-workspace">
          {viewMode !== 'graph' && (
            <div className="editor-top-nav">
              {/* Integrated Open File Tabs */}
              <div className="header-tabs-container flex-1 min-w-0">
                {openFiles.map((file) => {
                  const isActive = activeFilePath === file.path
                  const ext = file.name.split('.').pop()?.toLowerCase() || ''
                  return (
                    <div
                      key={file.path}
                      className={`header-tab ${isActive ? 'active' : ''}`}
                      onClick={(): void => handleTabSelect(file.path)}
                    >
                      <span className="header-tab-icon">
                        {ext === 'py' ? (
                          <Terminal size={12} className="text-purple-400" />
                        ) : ext === 'html' ? (
                          <Globe size={12} className="text-orange-400" />
                        ) : (
                          <FileText size={12} className="text-zinc-400" />
                        )}
                      </span>
                      <span>{file.name}</span>
                      <span
                        className="header-tab-close"
                        onClick={(e): void => {
                          e.stopPropagation()
                          handleTabClose(file.path)
                        }}
                      >
                        ×
                      </span>
                    </div>
                  )
                })}
                {openFiles.length > 0 && (
                  <button
                    className="titlebar-add-btn"
                    onClick={handleCreateFileAtRoot}
                    title="New Tab"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="editor-center-split">
            {viewMode === 'graph' && workspacePath ? (
              <GraphView
                workspacePath={workspacePath}
                onNodeClick={(nodeId): void => void handleFileSelect(nodeId)}
                onClose={(): void => setViewMode('editor')}
              />
            ) : activeFilePath ? (
              <div className="editor-container">
                <div className="editor-wrapper">
                  <div className="editor-decorations mb-4 flex flex-col gap-2">
                    {activeFileBanner && (
                      <div className="banner-preview relative group w-full h-36 rounded-lg overflow-hidden border border-zinc-800">
                        <img
                          src={activeFileBanner}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        <button
                          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(): void => {
                            const rel = getRelativePath(activeFilePath, workspacePath)
                            setFileBanners((prev) => {
                              const updated = { ...prev }
                              delete updated[rel.toLowerCase()]
                              return updated
                            })
                          }}
                        >
                          Remove Banner
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        className="text-2xl p-1 rounded hover:bg-zinc-800/50 transition-colors"
                        onClick={(): void => setShowEmojiPicker((prev) => !prev)}
                        title="Change Icon"
                      >
                        {activeFileIcon || '📝'}
                      </button>

                      {!activeFileBanner && (
                        <button
                          className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                          onClick={(): void => setShowBannerPicker((prev) => !prev)}
                        >
                          🖼️ Add Banner
                        </button>
                      )}
                    </div>

                    {showEmojiPicker && (
                      <EmojiPicker
                        onSelect={(emoji): void => {
                          const rel = getRelativePath(activeFilePath, workspacePath)
                          setFileIcons((prev) => ({ ...prev, [rel.toLowerCase()]: emoji }))
                          setShowEmojiPicker(false)
                        }}
                        onClose={(): void => setShowEmojiPicker(false)}
                      />
                    )}

                    {showBannerPicker && (
                      <BannerPicker
                        onSelect={(bannerUrl): void => {
                          const rel = getRelativePath(activeFilePath, workspacePath)
                          setFileBanners((prev) => ({ ...prev, [rel.toLowerCase()]: bannerUrl }))
                          setShowBannerPicker(false)
                        }}
                        onClose={(): void => setShowBannerPicker(false)}
                      />
                    )}
                  </div>

                  <input
                    className="document-title-input"
                    type="text"
                    value={
                      activeFilePath
                        ? activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || ''
                        : ''
                    }
                    onChange={(e): void => {
                      const newTitle = e.target.value
                      if (!activeFilePath || !workspacePath) return
                      const dir = activeFilePath.substring(0, activeFilePath.lastIndexOf('/'))
                      const newPath = `${dir}/${newTitle}.md`
                      if (newPath !== activeFilePath) {
                        void window.api.fs
                          .renamePath(activeFilePath, newPath)
                          .then(() => {
                            setActiveFilePath(newPath)
                            setOpenFiles((prev) =>
                              prev.map((f) =>
                                f.path === activeFilePath
                                  ? { path: newPath, name: `${newTitle}.md` }
                                  : f
                              )
                            )
                          })
                          .catch((err) => alert(`Rename error: ${err}`))
                      }
                    }}
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
                    onWikilinkClick={handleWikilinkClick}
                  />
                </div>
              </div>
            ) : (
              <WelcomeScreen workspacePath={workspacePath} />
            )}

            {/* ====== FLOATING WIDGET WINDOWS ====== */}
            {viewMode !== 'graph' && (
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
                    initialPos={{ x: Math.max(260, window.innerWidth - 380), y: 85 }}
                    initialSize={{ width: 330, height: 420 }}
                    zIndex={widgetZIndexes.assistant}
                    onFocus={(): void => bringWidgetToFront('assistant')}
                    onClose={(): void => handleToggleWidget('assistant')}
                  >
                    <AssistantPanel />
                  </FloatingWindow>
                )}

                {widgetState.stats && (
                  <FloatingWindow
                    id="stats"
                    title="Document Stats & Outline"
                    icon={<BarChart2 size={13} className="text-emerald-400" />}
                    initialPos={{ x: 260, y: 85 }}
                    initialSize={{ width: 290, height: 340 }}
                    zIndex={widgetZIndexes.stats}
                    onFocus={(): void => bringWidgetToFront('stats')}
                    onClose={(): void => handleToggleWidget('stats')}
                  >
                    <DocumentStatsWidget
                      content={activeFilePath ? fileContents[activeFilePath] || '' : ''}
                      activeFileName={
                        activeFilePath ? activeFilePath.split(/[\\/]/).pop() : undefined
                      }
                    />
                  </FloatingWindow>
                )}

                {widgetState.terminal && (
                  <FloatingWindow
                    id="terminal"
                    title="Quick Terminal"
                    icon={<Terminal size={13} className="text-blue-400" />}
                    initialPos={{
                      x: Math.max(260, window.innerWidth - 480),
                      y: Math.max(100, window.innerHeight - 270)
                    }}
                    initialSize={{ width: 440, height: 220 }}
                    zIndex={widgetZIndexes.terminal}
                    onFocus={(): void => bringWidgetToFront('terminal')}
                    onClose={(): void => handleToggleWidget('terminal')}
                  >
                    <QuickTerminalWidget />
                  </FloatingWindow>
                )}

                {widgetState.snippets && (
                  <FloatingWindow
                    id="snippets"
                    title="Code Snippets"
                    icon={<Code2 size={13} className="text-amber-400" />}
                    initialPos={{ x: 320, y: 140 }}
                    initialSize={{ width: 300, height: 340 }}
                    zIndex={widgetZIndexes.snippets}
                    onFocus={(): void => bringWidgetToFront('snippets')}
                    onClose={(): void => handleToggleWidget('snippets')}
                  >
                    <CodeSnippetsWidget
                      onInsertSnippet={(snippetText): void => {
                        if (activeFilePath) {
                          setFileContents((prev) => ({
                            ...prev,
                            [activeFilePath]: (prev[activeFilePath] || '') + '\n\n' + snippetText
                          }))
                        }
                      }}
                    />
                  </FloatingWindow>
                )}
              </>
            )}
          </div>
        </div>

        {/* ====== RIGHT SIDEBAR PANEL ====== */}
        {viewMode !== 'graph' && (
          <div
            className={`right-sidebar-panel ${!showRightSidebar ? 'is-collapsed' : ''} ${
              isResizingRight ? 'is-resizing' : ''
            }`}
            style={{ width: showRightSidebar ? rightSidebarWidth : 0 }}
          >
            <div
              className="sidebar-resize-handle sidebar-resize-handle-left"
              onMouseDown={startRightResize}
            />
            <div className="right-sidebar-header">
              <span className="text-xs font-semibold text-zinc-300">Outline</span>
              <button
                className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-colors"
                onClick={(): void => setShowRightSidebar(false)}
                title="Close Right Sidebar"
              >
                ×
              </button>
            </div>
            <div className="right-sidebar-content">
              {activeFilePath ? (
                <div className="flex flex-col gap-1 text-[11px] text-zinc-400 p-2">
                  {(fileContents[activeFilePath] || '')
                    .split('\n')
                    .map((line, idx) => {
                      const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
                      if (!headingMatch) return null
                      const level = headingMatch[1].length
                      const text = headingMatch[2]
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          style={{ paddingLeft: `${(level - 1) * 10 + 8}px` }}
                        >
                          <span className="text-purple-400 font-mono text-[9px] shrink-0">
                            H{level}
                          </span>
                          <span className="truncate text-zinc-300">{text}</span>
                        </div>
                      )
                    })
                    .filter(Boolean)}
                  {!(fileContents[activeFilePath] || '').match(/^#{1,6}\s+/m) && (
                    <div className="text-zinc-600 text-center py-4 italic text-[11px]">
                      No headings found
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-600 text-center py-8 text-[11px]">No file open</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====== 5. BOTTOM STATUS BAR ====== */}
      <StatusBar
        workspacePath={workspacePath}
        activeFilePath={activeFilePath}
        activeFileContent={activeFilePath ? fileContents[activeFilePath] : undefined}
        cursorPosition={cursorPosition}
        autoSaveEnabled={autoSaveEnabled}
        activeUnsaved={activeUnsaved}
        onToggleRightPanel={(): void => setShowRightSidebar((p) => !p)}
      />
    </div>
  )
}
