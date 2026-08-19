import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { PanelLeftOpen, Smile, Image as ImageIcon } from 'lucide-react'
import BlockEditor from './components/BlockEditor'
import EmojiPicker from './components/EmojiPicker'
import BannerPicker from './components/BannerPicker'
import WelcomeScreen from './components/WelcomeScreen'
import SettingsModal from './components/SettingsModal'
import TopHeader from './components/layout/TopHeader'
import SubHeader from './components/layout/SubHeader'
import Sidebar from './components/layout/Sidebar'
import TabBar from './components/layout/TabBar'
import FloatingWidgetsOverlay from './components/layout/FloatingWidgetsOverlay'
import StatusBar from './components/layout/StatusBar'

const GraphView = lazy(() => import('./components/GraphView'))

import { MarkdownMetadata, OpenFileInfo, ViewMode, StatusStatsConfig } from './types'
import { normalizePath, getRelativePath, getPathKey } from './utils/pathUtils'
import { stripFrontmatter } from './utils/metadataUtils'
import { metadataEngine } from './utils/metadataEngine'
import { manipulateSvgTheme } from './utils/themeSvgUtils'

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
  const [showCover, setShowCover] = useState<boolean>(true)
  const [showIcon, setShowIcon] = useState<boolean>(true)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)

  const [viewMode, setViewMode] = useState<ViewMode>(() => savedState.viewMode ?? 'editor')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(
    () => savedState.autoSaveEnabled ?? true
  )

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

  // Granular Status Bar Stats Metrics Configuration
  const [statsConfig, setStatsConfig] = useState<StatusStatsConfig>(() => {
    try {
      const saved = localStorage.getItem('notie_status_stats_config')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      showWords: true,
      showLines: true,
      showChars: false,
      showSpaces: true,
      showReadingTime: false,
      showLanguage: true,
      showSavedBadge: true
    }
  })

  const handleToggleStat = useCallback((key: keyof StatusStatsConfig) => {
    setStatsConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('notie_status_stats_config', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
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

  const handleRenameWorkspace = useCallback(
    async (newName?: string): Promise<void> => {
      if (!workspacePath) return
      const currentName = workspaceName || workspacePath.split(/[\\/]/).pop() || 'Workspace'
      const targetName =
        newName !== undefined
          ? newName.trim()
          : prompt('Enter new workspace folder name:', currentName)?.trim()
      if (!targetName || targetName === currentName) return

      const parentDir = workspacePath.substring(
        0,
        Math.max(workspacePath.lastIndexOf('/'), workspacePath.lastIndexOf('\\'))
      )
      const newPath = normalizePath(`${parentDir}/${targetName}`)
      try {
        await window.api.fs.renamePath(workspacePath, newPath)
        setWorkspacePath(newPath)
        setWorkspaceName(targetName)
        updateRecentWorkspaces(newPath, targetName)
        setOpenFiles((prev) =>
          prev.map((f) => {
            const rel = f.path.substring(workspacePath.length)
            return { ...f, path: normalizePath(`${newPath}${rel}`) }
          })
        )
        if (activeFilePath && activeFilePath.startsWith(workspacePath)) {
          const rel = activeFilePath.substring(workspacePath.length)
          setActiveFilePath(normalizePath(`${newPath}${rel}`))
        }
      } catch (err) {
        alert(`Error renaming workspace folder: ${err}`)
      }
    },
    [workspacePath, workspaceName, activeFilePath, updateRecentWorkspaces]
  )

  const loadFileContent = useCallback(
    async (filePath: string): Promise<string> => {
      const normPath = normalizePath(filePath)
      if (!normPath) return ''

      if (fileContents[normPath] !== undefined) {
        const clean = stripFrontmatter(fileContents[normPath])
        if (clean !== fileContents[normPath]) {
          setFileContents((prev) => ({ ...prev, [normPath]: clean }))
        }
        return clean
      }
      try {
        const rawContent = await window.api.fs.readFile(normPath)
        let bodyContent = rawContent

        if (normPath.endsWith('.md')) {
          const rel = getRelativePath(normPath, workspacePath)
          const parsed = await metadataEngine.parseDocumentAsync(rawContent, rel)
          bodyContent = parsed.cleanContent
          const relKey = rel.toLowerCase()
          if (parsed.metadata.icon) {
            setFileIcons((prev) => ({ ...prev, [relKey]: parsed.metadata.icon! }))
          }
          if (parsed.metadata.banner) {
            setFileBanners((prev) => ({ ...prev, [relKey]: parsed.metadata.banner! }))
          }
        }

        setFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        setOriginalFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        return bodyContent
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
      const relKey = rel.toLowerCase()
      if (fileIcons[relKey]) metadataEngine.setIcon(rel, fileIcons[relKey])
      if (fileBanners[relKey]) metadataEngine.setBanner(rel, fileBanners[relKey])
      contentToSave = await metadataEngine.prepareForSaveAsync(contentToSave, rel)
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
  const unsavedFiles = useMemo(() => {
    const unsaved: Record<string, boolean> = {}
    for (const [filePath, current] of Object.entries(fileContents)) {
      const original = originalFileContents[filePath]
      if (original !== undefined && current !== original) {
        unsaved[filePath] = true
        const norm = normalizePath(filePath)
        unsaved[norm] = true
        unsaved[getPathKey(filePath)] = true
      }
    }
    return unsaved
  }, [fileContents, originalFileContents])

  const activeUnsaved = activeFilePath
    ? !!unsavedFiles[normalizePath(activeFilePath)] ||
      fileContents[activeFilePath] !== originalFileContents[activeFilePath]
    : false

  const activeRelKey = activeFilePath
    ? getRelativePath(activeFilePath, workspacePath).toLowerCase()
    : ''

  const activeFileIcon = activeFilePath ? fileIcons[activeRelKey] : undefined
  const activeFileBanner = activeFilePath ? fileBanners[activeRelKey] : undefined

  // Global keyboard shortcut for Settings (Ctrl + , or Cmd + ,)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        setShowSettingsModal((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-container">
      {/* ====== 1. TOP WINDOW TITLEBAR ====== */}
      <TopHeader
        workspacePath={workspacePath}
        workspaceName={workspaceName}
        activeFilePath={activeFilePath}
        fileIcons={fileIcons}
        recentWorkspaces={recentWorkspaces}
        onSwitchWorkspace={handleSwitchWorkspace}
        onOpenWorkspace={handleOpenWorkspace}
        onRenameWorkspace={handleRenameWorkspace}
        onCloseWorkspace={handleCloseWorkspace}
        onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
        onOpenSettings={(): void => setShowSettingsModal(true)}
      />

      {/* ====== 2. SUB-HEADER QUICK ACTIONS BAR ====== */}
      <SubHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={(): void => setSidebarCollapsed((p) => !p)}
        onSaveActiveFile={handleSaveActiveFile}
        viewMode={viewMode}
        onToggleViewMode={(): void => setViewMode((m) => (m === 'graph' ? 'editor' : 'graph'))}
        setViewMode={setViewMode}
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
        showSearchInput={showSearchInput}
        onToggleSearchInput={(): void => setShowSearchInput((prev) => !prev)}
      />

      {/* ====== 3. MAIN APP CONTENT CONTAINER ====== */}
      <div className="app-main">
        {/* Floating Open Sidebar Button when collapsed */}
        {sidebarCollapsed && (
          <button
            type="button"
            className="floating-sidebar-toggle-btn"
            onClick={(): void => setSidebarCollapsed(false)}
            title="Expand Explorer Sidebar"
          >
            <PanelLeftOpen size={13} strokeWidth={1.5} />
          </button>
        )}

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
          unsavedFiles={unsavedFiles}
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
        <div className={`editor-workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {viewMode !== 'graph' && (
            <div className="editor-top-nav">
              <TabBar
                openFiles={openFiles}
                activeFilePath={activeFilePath}
                fileIcons={fileIcons}
                workspacePath={workspacePath}
                unsavedFiles={unsavedFiles}
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
              <div className="editor-writing-viewport">
                <div className="editor-container">
                  {/* 1. NOTION-STYLE FULL-WIDTH COVER BANNER */}
                  {showCover && activeFileBanner && (
                    <div
                      className="notion-cover-banner group"
                      style={
                        activeFileBanner.startsWith('linear-gradient')
                          ? { background: activeFileBanner }
                          : {
                              backgroundImage: `url("${activeFileBanner}")`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                              backgroundRepeat: 'no-repeat'
                            }
                      }
                    >
                      <div className="notion-cover-actions opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="notion-cover-btn"
                          onClick={(): void => setShowBannerPicker((prev) => !prev)}
                        >
                          <ImageIcon size={12} strokeWidth={1.5} className="shrink-0 opacity-80" />
                          <span>Change cover</span>
                        </button>
                        <button
                          className="notion-cover-btn"
                          onClick={(): void => {
                            if (!activeFilePath) return
                            const rel = getRelativePath(activeFilePath, workspacePath).toLowerCase()
                            setFileBanners((prev) => {
                              const updated = { ...prev }
                              delete updated[rel]
                              return updated
                            })
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="editor-wrapper">
                    {/* NOTION-STYLE PAGE HEADER */}
                    <div
                      className={`notion-page-header ${showCover && activeFileBanner ? 'has-cover' : ''}`}
                    >
                      {/* Top ghost buttons when no icon or cover exists */}
                      {((showIcon && !activeFileIcon) || (showCover && !activeFileBanner)) && (
                        <div className="notion-header-ghost-actions">
                          {showIcon && !activeFileIcon && (
                            <button
                              className="notion-ghost-btn"
                              onClick={(): void => setShowEmojiPicker(true)}
                            >
                              <Smile size={13} strokeWidth={1.5} className="shrink-0 opacity-70" />
                              <span>Add icon</span>
                            </button>
                          )}
                          {showCover && !activeFileBanner && (
                            <button
                              className="notion-ghost-btn"
                              onClick={(): void => setShowBannerPicker(true)}
                            >
                              <ImageIcon
                                size={13}
                                strokeWidth={1.5}
                                className="shrink-0 opacity-70"
                              />
                              <span>Add cover</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Page Icon Display */}
                      {showIcon && activeFileIcon && (
                        <div
                          className={`notion-icon-container group ${showCover && activeFileBanner ? 'has-cover' : ''}`}
                        >
                          <button
                            className="notion-icon-btn"
                            onClick={(): void => setShowEmojiPicker((prev) => !prev)}
                            title="Change icon"
                          >
                            {typeof activeFileIcon === 'string' &&
                            activeFileIcon.includes('<svg') ? (
                              <span
                                className="theme-svg-container"
                                dangerouslySetInnerHTML={{
                                  __html: manipulateSvgTheme(activeFileIcon)
                                }}
                              />
                            ) : (
                              activeFileIcon
                            )}
                          </button>

                          <div className="notion-icon-hover-toolbar opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="notion-icon-quick-btn"
                              onClick={(): void => {
                                if (!activeFilePath) return
                                const emojis = [
                                  '📝',
                                  '🚀',
                                  '💡',
                                  '🔥',
                                  '⭐',
                                  '🎨',
                                  '💻',
                                  '⚡',
                                  '🎯',
                                  '🌱'
                                ]
                                const randomEmoji =
                                  emojis[Math.floor(Math.random() * emojis.length)]
                                const rel = getRelativePath(
                                  activeFilePath,
                                  workspacePath
                                ).toLowerCase()
                                setFileIcons((prev) => ({
                                  ...prev,
                                  [rel]: randomEmoji
                                }))
                              }}
                            >
                              Random
                            </button>
                            <button
                              className="notion-icon-quick-btn"
                              onClick={(): void => {
                                if (!activeFilePath) return
                                const rel = getRelativePath(
                                  activeFilePath,
                                  workspacePath
                                ).toLowerCase()
                                setFileIcons((prev) => {
                                  const updated = { ...prev }
                                  delete updated[rel]
                                  return updated
                                })
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Popovers */}
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={(emoji): void => {
                            if (!activeFilePath) return
                            const rel = getRelativePath(activeFilePath, workspacePath).toLowerCase()
                            setFileIcons((prev) => ({ ...prev, [rel]: emoji }))
                            setShowEmojiPicker(false)
                          }}
                          onRemove={(): void => {
                            if (!activeFilePath) return
                            const rel = getRelativePath(activeFilePath, workspacePath).toLowerCase()
                            setFileIcons((prev) => {
                              const updated = { ...prev }
                              delete updated[rel]
                              return updated
                            })
                          }}
                          onClose={(): void => setShowEmojiPicker(false)}
                        />
                      )}

                      {showBannerPicker && (
                        <BannerPicker
                          onSelect={(bannerUrl): void => {
                            if (!activeFilePath) return
                            const rel = getRelativePath(activeFilePath, workspacePath).toLowerCase()
                            setFileBanners((prev) => ({ ...prev, [rel]: bannerUrl }))
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

                {/* Floating Stats, Tools & Autosave Pill inside Writing Area Viewport */}
                <StatusBar
                  activeFilePath={activeFilePath}
                  activeFileContent={activeFilePath ? fileContents[activeFilePath] : undefined}
                  stats={workerStats}
                  autoSaveEnabled={autoSaveEnabled}
                  activeUnsaved={activeUnsaved}
                  statsConfig={statsConfig}
                  onToggleStat={handleToggleStat}
                  showCover={showCover}
                  showIcon={showIcon}
                  onToggleCover={(): void => setShowCover((prev) => !prev)}
                  onToggleIcon={(): void => setShowIcon((prev) => !prev)}
                />
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
              onUpdateFileContent={(filePath, content): void => {
                setFileContents((prev) => ({ ...prev, [filePath]: content }))
              }}
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

            {/* ====== RIGHT SIDEBAR PANEL (OUTLINE) ====== */}
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
                              className="flex items-center gap-1.5 py-1 px-2 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                              style={{ paddingLeft: `${(level - 1) * 10 + 8}px` }}
                              onClick={(): void => {
                                const editorElem = document.querySelector('.editor-container')
                                if (!editorElem) return
                                const headers = editorElem.querySelectorAll(
                                  'h1, h2, h3, h4, h5, h6, .ce-header'
                                )
                                for (const h of Array.from(headers)) {
                                  if (h.textContent?.trim().includes(text.trim())) {
                                    h.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    break
                                  }
                                }
                              }}
                            >
                              <span className="text-zinc-400 font-mono text-[9px] shrink-0">
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
        </div>
      </div>

      {/* ====== 6. PREFERENCES & SETTINGS MODAL ====== */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={(): void => setShowSettingsModal(false)}
        currentAutoSave={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
      />
    </div>
  )
}
