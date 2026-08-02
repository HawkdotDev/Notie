import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import BlockEditor from './components/BlockEditor'
import EmojiPicker from './components/EmojiPicker'
import BannerPicker from './components/BannerPicker'
import WelcomeScreen from './components/WelcomeScreen'
import TopHeader from './components/layout/TopHeader'
import SubHeader from './components/layout/SubHeader'
import Sidebar from './components/layout/Sidebar'
import TabBar from './components/layout/TabBar'
import FloatingWidgetsOverlay from './components/layout/FloatingWidgetsOverlay'
import StatusBar from './components/layout/StatusBar'

const GraphView = lazy(() => import('./components/GraphView'))

import { MarkdownMetadata, OpenFileInfo, ViewMode } from './types'
import { normalizePath, getRelativePath } from './utils/pathUtils'
import { parseMarkdownMetadata, serializeMarkdownMetadata } from './utils/metadataUtils'

import { usePersistentState } from './hooks/usePersistentState'
import { useSidebarResize } from './hooks/useSidebarResize'
import { useWidgetManager } from './hooks/useWidgetManager'
import { useIndexerWorker } from './hooks/useIndexerWorker'

export default function App(): React.JSX.Element {
  const { savedState, saveState } = usePersistentState()

  const [workspacePath, setWorkspacePath] = useState<string | null>(
    () => savedState.workspacePath ?? 'c:\\Users\\dwaip\\OneDrive\\Documents\\Application'
  )
  const [workspaceName, setWorkspaceName] = useState<string>(
    () => savedState.workspaceName ?? 'Application'
  )
  const [activeFilePath, setActiveFilePath] = useState<string | null>(
    () => savedState.activeFilePath ?? null
  )

  const [openFiles, setOpenFiles] = useState<OpenFileInfo[]>(() => savedState.openFiles ?? [])
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [originalFileContents, setOriginalFileContents] = useState<Record<string, string>>({})

  const [fileIcons, setFileIcons] = useState<Record<string, string>>({})
  const [fileBanners, setFileBanners] = useState<Record<string, string>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)

  const [viewMode, setViewMode] = useState<ViewMode>(() => savedState.viewMode ?? 'editor')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(
    () => savedState.autoSaveEnabled ?? true
  )
  const [cursorPosition] = useState<{ line: number; column: number }>({
    line: 12,
    column: 6
  })

  // Sidebar collapse & resize custom hook
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => savedState.sidebarCollapsed ?? false
  )
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(
    () => savedState.showRightSidebar ?? false
  )
  const [showSearchInput, setShowSearchInput] = useState<boolean>(
    () => savedState.showSearchInput ?? false
  )
  const [showDiffToggle, setShowDiffToggle] = useState<boolean>(
    () => savedState.showDiffToggle ?? false
  )
  const [searchQuery, setSearchQuery] = useState<string>(() => savedState.searchQuery ?? '')

  const {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize
  } = useSidebarResize(savedState.sidebarWidth ?? 240, savedState.rightSidebarWidth ?? 220)

  // Floating Widgets Manager custom hook
  const {
    widgetState,
    widgetZIndexes,
    widgetPositions,
    bringWidgetToFront,
    handleToggleWidget,
    handleWidgetLayoutChange
  } = useWidgetManager(
    savedState.widgetState,
    savedState.widgetZIndexes,
    savedState.widgetPositions
  )

  // Multithreaded background Web Worker for document processing
  const { stats: workerStats } = useIndexerWorker(
    activeFilePath ? fileContents[activeFilePath] : ''
  )

  // Workspace initialization
  useEffect(() => {
    // Workspace init
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

  // Save application state to persistent localStorage on any UI state change
  useEffect(() => {
    saveState({
      workspacePath,
      workspaceName,
      activeFilePath,
      openFiles,
      viewMode,
      autoSaveEnabled,
      sidebarCollapsed,
      sidebarWidth,
      showRightSidebar,
      rightSidebarWidth,
      showSearchInput,
      showDiffToggle,
      searchQuery,
      widgetState,
      widgetZIndexes,
      widgetPositions
    })
  }, [
    workspacePath,
    workspaceName,
    activeFilePath,
    openFiles,
    viewMode,
    autoSaveEnabled,
    sidebarCollapsed,
    sidebarWidth,
    showRightSidebar,
    rightSidebarWidth,
    showSearchInput,
    showDiffToggle,
    searchQuery,
    widgetState,
    widgetZIndexes,
    widgetPositions,
    saveState
  ])

  // Re-hydrate contents for all restored open files on initial render
  useEffect(() => {
    openFiles.forEach((file) => {
      void loadFileContent(file.path)
    })
  }, [openFiles, loadFileContent])

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
          onStartResize={startLeftResize}
        />

        {/* Editor Workspace & Split Area */}
        <div className="editor-workspace">
          {viewMode !== 'graph' && (
            <div className="editor-top-nav">
              <TabBar
                openFiles={openFiles}
                activeFilePath={activeFilePath}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
                onCreateFileAtRoot={handleCreateFileAtRoot}
              />
            </div>
          )}

          <div className="editor-center-split">
            {viewMode === 'graph' && workspacePath ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center flex-1 text-zinc-500 text-xs italic">
                    Loading Knowledge Graph...
                  </div>
                }
              >
                <GraphView
                  workspacePath={workspacePath}
                  onNodeClick={(nodeId): void => void handleFileSelect(nodeId)}
                  onClose={(): void => setViewMode('editor')}
                />
              </Suspense>
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

            {/* ====== FLOATING WIDGET WINDOWS OVERLAY ====== */}
            <FloatingWidgetsOverlay
              viewMode={viewMode}
              widgetState={widgetState}
              widgetZIndexes={widgetZIndexes}
              widgetPositions={widgetPositions}
              activeFilePath={activeFilePath}
              fileContents={fileContents}
              bringWidgetToFront={bringWidgetToFront}
              handleToggleWidget={handleToggleWidget}
              handleWidgetLayoutChange={handleWidgetLayoutChange}
              onInsertSnippet={(snippetText): void => {
                if (activeFilePath) {
                  setFileContents((prev) => ({
                    ...prev,
                    [activeFilePath]: (prev[activeFilePath] || '') + '\n\n' + snippetText
                  }))
                }
              }}
            />
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
        stats={workerStats}
        cursorPosition={cursorPosition}
        autoSaveEnabled={autoSaveEnabled}
        activeUnsaved={activeUnsaved}
        onToggleRightPanel={(): void => setShowRightSidebar((p) => !p)}
      />
    </div>
  )
}
