import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { Smile, Image, AppWindow, ListTree, X, Minimize2 } from 'lucide-react'
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
import OutlineWidget from './components/layout/OutlineWidget'
import StatusBar from './components/layout/StatusBar'

const GraphView = lazy(() => import('./components/GraphView'))

import { MarkdownMetadata, OpenFileInfo, ViewMode, StatusStatsConfig } from './types'
import { normalizePath, getRelativePath, getPathKey } from './utils/pathUtils'
import { stripFrontmatter } from './utils/metadataUtils'
import { metadataEngine } from './utils/metadataEngine'
import { manipulateSvgTheme } from './utils/themeSvgUtils'
import { markdownToHtml } from './utils/markdownConverter'

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
  const [fileMetadataMap, setFileMetadataMap] = useState<Record<string, MarkdownMetadata>>({})
  const [lastEditedMap, setLastEditedMap] = useState<Record<string, number>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)
  const [globalShowCover, setGlobalShowCover] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mink_global_show_cover')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [globalShowIcon, setGlobalShowIcon] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mink_global_show_icon')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [globalShowFileName, setGlobalShowFileName] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mink_global_show_file_name')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)

  const [editorFontFamily, setEditorFontFamily] = useState<string>(
    () => localStorage.getItem('mink_editor_font_family') || "'Inter', sans-serif"
  )
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('mink_editor_font_size')
    return saved ? parseInt(saved, 10) : 15
  })
  const [editorLineHeight, setEditorLineHeight] = useState<string>(
    () => localStorage.getItem('mink_editor_line_height') || '1.7'
  )
  const [editorLetterSpacing, setEditorLetterSpacing] = useState<string>(
    () => localStorage.getItem('mink_editor_letter_spacing') || 'normal'
  )
  const [editorParagraphSpacing, setEditorParagraphSpacing] = useState<string>(
    () => localStorage.getItem('mink_editor_paragraph_spacing') || '1.2em'
  )
  const [editorFontWeight, setEditorFontWeight] = useState<string>(
    () => localStorage.getItem('mink_editor_font_weight') || '400'
  )
  const [editorTextAlign, setEditorTextAlign] = useState<string>(
    () => localStorage.getItem('mink_editor_text_align') || 'left'
  )
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [isPageLocked, setIsPageLocked] = useState<boolean>(false)

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
  const [showTabs, setShowTabs] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mink_show_tabs')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [showSearchInput, setShowSearchInput] = useState<boolean>(
    () => savedState.showSearchInput ?? false
  )
  const [searchQuery, setSearchQuery] = useState<string>(() => savedState.searchQuery ?? '')
  const [sidebarView, setSidebarView] = useState<'explorer' | 'plugins'>(() => {
    try {
      const saved = localStorage.getItem('mink_sidebar_view')
      return (saved as 'explorer' | 'plugins') || 'explorer'
    } catch {
      return 'explorer'
    }
  })
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mink_enabled_plugins')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      'katex-math': true,
      'daily-notes': true,
      'mermaid-pro': true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('mink_show_tabs', String(showTabs))
    } catch {
      // ignore
    }
  }, [showTabs])

  useEffect(() => {
    try {
      localStorage.setItem('mink_sidebar_view', sidebarView)
    } catch {
      // ignore
    }
  }, [sidebarView])

  const handleTogglePlugin = useCallback((pluginId: string) => {
    setEnabledPlugins((prev) => {
      const updated = { ...prev, [pluginId]: !prev[pluginId] }
      try {
        localStorage.setItem('mink_enabled_plugins', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleTogglePluginsView = useCallback(() => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setSidebarView('plugins')
    } else if (sidebarView === 'plugins') {
      setSidebarView('explorer')
    } else {
      setSidebarView('plugins')
    }
  }, [sidebarCollapsed, sidebarView])

  const handleSwitchToFiles = useCallback(() => {
    setSidebarView('explorer')
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
  }, [sidebarCollapsed])

  const {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize
  } = useSidebarResize(savedState.sidebarWidth ?? 240, savedState.rightSidebarWidth ?? 220)

  // Per-file vs Global display options resolution
  const activeRelKey = useMemo(() => {
    if (!activeFilePath || !workspacePath) return ''
    return getRelativePath(activeFilePath, workspacePath).toLowerCase()
  }, [activeFilePath, workspacePath])

  const activeFileMeta = fileMetadataMap[activeRelKey]

  const isOnlyThisFile = useMemo(() => {
    if (!activeFileMeta) return false
    return (
      activeFileMeta.showCover !== undefined ||
      activeFileMeta.showIcon !== undefined ||
      activeFileMeta.showFileName !== undefined
    )
  }, [activeFileMeta])

  const effectiveShowCover =
    activeFileMeta?.showCover !== undefined ? activeFileMeta.showCover : globalShowCover
  const effectiveShowIcon =
    activeFileMeta?.showIcon !== undefined ? activeFileMeta.showIcon : globalShowIcon
  const effectiveShowFileName =
    activeFileMeta?.showFileName !== undefined ? activeFileMeta.showFileName : globalShowFileName

  // Floating Widgets Manager custom hook
  const {
    widgetState,
    setWidgetState,
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

  // Workspace Icons custom emoji mapping
  const [workspaceIcons, setWorkspaceIcons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('mink_workspace_icons')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handleSetWorkspaceIcon = useCallback((wsPath: string, icon: string | null) => {
    setWorkspaceIcons((prev) => {
      const next = { ...prev }
      const key = getPathKey(wsPath)
      if (!icon) {
        delete next[key]
        delete next[wsPath]
      } else {
        next[key] = icon
        next[wsPath] = icon
      }
      try {
        localStorage.setItem('mink_workspace_icons', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Granular Status Bar Stats Metrics Configuration
  const [statsConfig, setStatsConfig] = useState<StatusStatsConfig>(() => {
    try {
      const saved = localStorage.getItem('mink_status_stats_config')
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
        localStorage.setItem('mink_status_stats_config', JSON.stringify(next))
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
          setFileMetadataMap((prev) => ({
            ...prev,
            [relKey]: { ...parsed.metadata }
          }))
        }

        setFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        setOriginalFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        setLastEditedMap((prev) => (prev[normPath] ? prev : { ...prev, [normPath]: Date.now() }))
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
      const meta = fileMetadataMap[relKey] || {}
      if (fileIcons[relKey]) metadataEngine.setIcon(rel, fileIcons[relKey])
      if (fileBanners[relKey]) metadataEngine.setBanner(rel, fileBanners[relKey])
      metadataEngine.setShowCover(rel, meta.showCover)
      metadataEngine.setShowIcon(rel, meta.showIcon)
      metadataEngine.setShowFileName(rel, meta.showFileName)

      contentToSave = await metadataEngine.prepareForSaveAsync(contentToSave, rel, {
        icon: fileIcons[relKey],
        banner: fileBanners[relKey],
        showCover: meta.showCover,
        showIcon: meta.showIcon,
        showFileName: meta.showFileName
      })
    }

    try {
      await window.api.fs.writeFile(normPath, contentToSave)
      setOriginalFileContents((prev) => ({ ...prev, [normPath]: fileContents[normPath] ?? '' }))
      setLastEditedMap((prev) => ({ ...prev, [normPath]: Date.now() }))
    } catch (err) {
      alert(`Error saving file: ${err}`)
    }
  }, [activeFilePath, fileContents, fileIcons, fileBanners, fileMetadataMap, workspacePath])

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

  const handleToggleOnlyThisFile = useCallback(() => {
    if (!activeFilePath || !workspacePath) return
    const rel = getRelativePath(activeFilePath, workspacePath)
    const relKey = rel.toLowerCase()

    setFileMetadataMap((prev) => {
      const current = prev[relKey] || {}
      const currentlyOnlyThisFile =
        current.showCover !== undefined ||
        current.showIcon !== undefined ||
        current.showFileName !== undefined

      const nextMeta = { ...current }
      if (currentlyOnlyThisFile) {
        delete nextMeta.showCover
        delete nextMeta.showIcon
        delete nextMeta.showFileName
        metadataEngine.clearFileOverrides(rel)
      } else {
        nextMeta.showCover = effectiveShowCover
        nextMeta.showIcon = effectiveShowIcon
        nextMeta.showFileName = effectiveShowFileName
        metadataEngine.setShowCover(rel, effectiveShowCover)
        metadataEngine.setShowIcon(rel, effectiveShowIcon)
        metadataEngine.setShowFileName(rel, effectiveShowFileName)
      }
      return { ...prev, [relKey]: nextMeta }
    })

    setTimeout(() => {
      void handleSaveActiveFile()
    }, 50)
  }, [
    activeFilePath,
    workspacePath,
    effectiveShowCover,
    effectiveShowIcon,
    effectiveShowFileName,
    handleSaveActiveFile
  ])

  const handleToggleCover = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowCover
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showCover: nextVal }
      }))
      metadataEngine.setShowCover(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowCover((prev) => {
        const next = !prev
        try {
          localStorage.setItem('mink_global_show_cover', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [isOnlyThisFile, activeFilePath, workspacePath, effectiveShowCover, handleSaveActiveFile])

  const handleToggleIcon = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowIcon
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showIcon: nextVal }
      }))
      metadataEngine.setShowIcon(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowIcon((prev) => {
        const next = !prev
        try {
          localStorage.setItem('mink_global_show_icon', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [isOnlyThisFile, activeFilePath, workspacePath, effectiveShowIcon, handleSaveActiveFile])

  const handleToggleFileName = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowFileName
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showFileName: nextVal }
      }))
      metadataEngine.setShowFileName(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowFileName((prev) => {
        const next = !prev
        try {
          localStorage.setItem('mink_global_show_file_name', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [isOnlyThisFile, activeFilePath, workspacePath, effectiveShowFileName, handleSaveActiveFile])

  const handleMetadataLoaded = useCallback(
    (filePath: string, metadata: MarkdownMetadata): void => {
      const rel = getRelativePath(filePath, workspacePath)
      const relKey = rel.toLowerCase()
      if (metadata.icon) {
        setFileIcons((prev) => ({ ...prev, [relKey]: metadata.icon! }))
      }
      if (metadata.banner) {
        setFileBanners((prev) => ({ ...prev, [relKey]: metadata.banner! }))
      }
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], ...metadata }
      }))
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

  const handleFontFamilyChange = useCallback((font: string) => {
    setEditorFontFamily(font)
    try {
      localStorage.setItem('mink_editor_font_family', font)
    } catch {
      // ignore
    }
  }, [])

  const handleFontSizeChange = useCallback((size: number) => {
    setEditorFontSize(size)
    try {
      localStorage.setItem('mink_editor_font_size', size.toString())
    } catch {
      // ignore
    }
  }, [])

  const handleLineHeightChange = useCallback((val: string) => {
    setEditorLineHeight(val)
    try {
      localStorage.setItem('mink_editor_line_height', val)
    } catch {
      // ignore
    }
  }, [])

  const handleLetterSpacingChange = useCallback((val: string) => {
    setEditorLetterSpacing(val)
    try {
      localStorage.setItem('mink_editor_letter_spacing', val)
    } catch {
      // ignore
    }
  }, [])

  const handleParagraphSpacingChange = useCallback((val: string) => {
    setEditorParagraphSpacing(val)
    try {
      localStorage.setItem('mink_editor_paragraph_spacing', val)
    } catch {
      // ignore
    }
  }, [])

  const handleFontWeightChange = useCallback((val: string) => {
    setEditorFontWeight(val)
    try {
      localStorage.setItem('mink_editor_font_weight', val)
    } catch {
      // ignore
    }
  }, [])

  const handleTextAlignChange = useCallback((val: string) => {
    setEditorTextAlign(val)
    try {
      localStorage.setItem('mink_editor_text_align', val)
    } catch {
      // ignore
    }
  }, [])

  const handleToggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => {
      const next = !prev
      try {
        window.api?.window?.toggleFullScreen?.()
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const handleToggleLockPage = useCallback(() => {
    setIsPageLocked((prev) => !prev)
  }, [])

  const handleDuplicateFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath || !workspacePath) return
    const lastSlash = Math.max(activeFilePath.lastIndexOf('/'), activeFilePath.lastIndexOf('\\'))
    const dir = lastSlash > 0 ? activeFilePath.substring(0, lastSlash) : workspacePath
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const newFileName = `${baseName} (copy).md`
    const newPath = normalizePath(`${dir}/${newFileName}`)
    const content = fileContents[normalizePath(activeFilePath)] || ''
    try {
      await window.api.fs.createFile(dir, newFileName)
      await window.api.fs.writeFile(newPath, content)
      await handleFileSelect(newPath)
    } catch (err) {
      alert(`Failed to duplicate: ${err}`)
    }
  }, [activeFilePath, workspacePath, fileContents, handleFileSelect])

  const handleDeleteFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath) return
    const name = activeFilePath.split(/[\\/]/).pop() || 'file'
    const confirmed = confirm(`Are you sure you want to move "${name}" to trash?`)
    if (!confirmed) return
    try {
      await window.api.fs.deletePath(activeFilePath)
      handleTabClose(activeFilePath)
    } catch (err) {
      alert(`Failed to delete: ${err}`)
    }
  }, [activeFilePath, handleTabClose])

  const handleExportHTML = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const htmlBody = markdownToHtml(rawContent)
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <style>
    body {
      font-family: ${editorFontFamily};
      font-size: ${editorFontSize}px;
      line-height: 1.65;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #e4e4e7;
      background: #18181b;
    }
    h1, h2, h3, h4, h5, h6 { color: #f4f4f5; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2.2em; border-bottom: 1px solid #27272a; padding-bottom: 0.3em; }
    h2 { font-size: 1.6em; border-bottom: 1px solid #27272a; padding-bottom: 0.3em; }
    h3 { font-size: 1.3em; }
    p { margin-bottom: 1em; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #27272a; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: 0.5em 1em; color: #a1a1aa; background: #202023; border-radius: 0 4px 4px 0; }
    ul, ol { padding-left: 2em; margin-bottom: 1em; }
    li { margin-bottom: 0.3em; }
    hr { border: none; border-top: 1px solid #27272a; margin: 2em 0; }
    img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #27272a; padding: 8px 12px; text-align: left; }
    th { background: #202023; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.html`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, fullHtml)
      }
    } catch (err) {
      alert(`Export HTML error: ${err}`)
    }
  }, [activeFilePath, fileContents, editorFontFamily, editorFontSize])

  const handleExportText = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const plainText = stripFrontmatter(rawContent).replace(/[#*_`~[\]()]/g, '')
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.txt`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, plainText)
      }
    } catch (err) {
      alert(`Export Text error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleExportMarkdown = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop() || 'document.md'
    try {
      const savePath = await window.api.fs.showSaveDialog(baseName)
      if (savePath) {
        await window.api.fs.writeFile(savePath, rawContent)
      }
    } catch (err) {
      alert(`Export Markdown error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleCopyLink = useCallback(() => {
    if (!activeFilePath) return
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    navigator.clipboard.writeText(`[[${baseName}]]`)
  }, [activeFilePath])

  const handleImportFile = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt,.json'
      input.onchange = async (e: Event): Promise<void> => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const text = await file.text()
        const fileName = file.name
        if (workspacePath) {
          const newPath = normalizePath(`${workspacePath}/${fileName}`)
          await window.api.fs.writeFile(newPath, text)
          await handleFileSelect(newPath)
        }
      }
      input.click()
    } catch (err) {
      alert(`Import error: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  // Keyboard Shortcuts (Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+W, F11, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false)
        try {
          window.api?.window?.toggleFullScreen?.()
        } catch {
          // ignore
        }
        return
      }
      if (e.key === 'F11') {
        e.preventDefault()
        handleToggleFullScreen()
        return
      }
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
    isFullScreen,
    handleSaveActiveFile,
    handleOpenWorkspace,
    handleTabClose,
    handleCreateFileAtRoot,
    handleToggleFullScreen
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
    <div className={`app-container ${isFullScreen ? 'distraction-free-fullscreen' : ''}`}>
      {/* Floating Exit Fullscreen Button in Distraction-Free Mode */}
      {isFullScreen && (
        <div className="fullscreen-exit-wrapper">
          <button
            type="button"
            className="exit-fullscreen-floating-btn"
            onClick={handleToggleFullScreen}
            title="Exit Full Screen (Esc / F11)"
          >
            <Minimize2 size={13} />
            <span>Exit Full Screen</span>
          </button>
        </div>
      )}

      {/* ====== 1. TOP WINDOW TITLEBAR ====== */}
      <TopHeader
        onOpenSettings={(): void => setShowSettingsModal(true)}
        viewMode={viewMode}
        onToggleViewMode={(): void => setViewMode((m) => (m === 'graph' ? 'editor' : 'graph'))}
        setViewMode={setViewMode}
        sidebarView={sidebarView}
        sidebarCollapsed={sidebarCollapsed}
        onTogglePluginsView={handleTogglePluginsView}
        onSwitchToFiles={handleSwitchToFiles}
        enabledPluginsCount={Object.values(enabledPlugins).filter(Boolean).length}
        showSearchInput={showSearchInput}
        onToggleSearchInput={(): void => setShowSearchInput((prev) => !prev)}
        showTabs={showTabs}
        onToggleTabs={(): void => setShowTabs((p) => !p)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={(): void => setShowRightSidebar((p) => !p)}
        widgetState={widgetState}
        onToggleWidget={handleToggleWidget}
        activeUnsaved={activeUnsaved}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
        showCover={effectiveShowCover}
        showIcon={effectiveShowIcon}
        showFileName={effectiveShowFileName}
        isOnlyThisFile={isOnlyThisFile}
        activeFilePath={activeFilePath}
        onToggleCover={handleToggleCover}
        onToggleIcon={handleToggleIcon}
        onToggleFileName={handleToggleFileName}
        onToggleOnlyThisFile={handleToggleOnlyThisFile}
      />

      {/* ====== 2. SUB-HEADER ACTIONS & BREADCRUMBS BAR (Full width above sidebar) ====== */}
      <SubHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={(): void => setSidebarCollapsed((p) => !p)}
        workspacePath={workspacePath}
        workspaceName={workspaceName}
        activeFilePath={activeFilePath}
        onOpenWorkspace={handleOpenWorkspace}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
        onExportHTML={handleExportHTML}
        onExportText={handleExportText}
        onExportMarkdown={handleExportMarkdown}
        onCopyLink={handleCopyLink}
        lastEditedTime={
          activeFilePath ? lastEditedMap[normalizePath(activeFilePath)] || null : null
        }
        statsConfig={statsConfig}
        onToggleStat={handleToggleStat}
        showCover={effectiveShowCover}
        showIcon={effectiveShowIcon}
        showFileName={effectiveShowFileName}
        isOnlyThisFile={isOnlyThisFile}
        onToggleCover={handleToggleCover}
        onToggleIcon={handleToggleIcon}
        onToggleFileName={handleToggleFileName}
        onToggleOnlyThisFile={handleToggleOnlyThisFile}
        fileContent={activeFilePath ? fileContents[normalizePath(activeFilePath)] : ''}
        editorFontFamily={editorFontFamily}
        onChangeFontFamily={handleFontFamilyChange}
        editorFontSize={editorFontSize}
        onChangeFontSize={handleFontSizeChange}
        editorLineHeight={editorLineHeight}
        onChangeLineHeight={handleLineHeightChange}
        editorLetterSpacing={editorLetterSpacing}
        onChangeLetterSpacing={handleLetterSpacingChange}
        editorParagraphSpacing={editorParagraphSpacing}
        onChangeParagraphSpacing={handleParagraphSpacingChange}
        editorFontWeight={editorFontWeight}
        onChangeFontWeight={handleFontWeightChange}
        editorTextAlign={editorTextAlign}
        onChangeTextAlign={handleTextAlignChange}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        isPageLocked={isPageLocked}
        onToggleLockPage={handleToggleLockPage}
        onDuplicateFile={handleDuplicateFile}
        onDeleteFile={handleDeleteFile}
        onImport={handleImportFile}
      />

      {/* ====== 3. MAIN APP CONTENT CONTAINER (One level below breadcrumbs bar) ====== */}
      <div className="app-main">
        {/* Sidebar Panel */}
        <Sidebar
          activeView={sidebarView}
          sidebarCollapsed={sidebarCollapsed}
          sidebarWidth={sidebarWidth}
          isResizing={isResizingLeft}
          workspacePath={workspacePath}
          workspaceName={workspaceName}
          workspaceIcons={workspaceIcons}
          onSetWorkspaceIcon={handleSetWorkspaceIcon}
          recentWorkspaces={recentWorkspaces}
          activeFilePath={activeFilePath}
          onFileSelect={handleFileSelect}
          onCreateFileAtRoot={handleCreateFileAtRoot}
          onOpenWorkspace={handleOpenWorkspace}
          onCloseWorkspace={handleCloseWorkspace}
          onSwitchWorkspace={handleSwitchWorkspace}
          onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          showSearchInput={showSearchInput}
          onToggleSearchInput={(): void => setShowSearchInput((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fileIcons={fileIcons}
          onMetadataLoaded={handleMetadataLoaded}
          onStartResize={startLeftResize}
          enabledPlugins={enabledPlugins}
          onTogglePlugin={handleTogglePlugin}
        />

        {/* Editor Workspace & Split Area */}
        <div className={`editor-workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {viewMode !== 'graph' && showTabs && (
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
                <div
                  className="editor-container"
                  style={
                    {
                      '--editor-font-family': editorFontFamily,
                      '--editor-font-size': `${editorFontSize}px`,
                      '--editor-line-height': editorLineHeight,
                      '--editor-letter-spacing': editorLetterSpacing,
                      '--editor-paragraph-spacing': editorParagraphSpacing,
                      '--editor-font-weight': editorFontWeight,
                      '--editor-text-align': editorTextAlign
                    } as React.CSSProperties
                  }
                >
                  {/* 1. NOTION-STYLE FULL-WIDTH COVER BANNER */}
                  {effectiveShowCover && activeFileBanner && (
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
                          <Image size={12} strokeWidth={1.75} className="shrink-0 opacity-80" />
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

                  <div
                    className={`editor-wrapper ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''}`}
                  >
                    {/* NOTION-STYLE PAGE HEADER */}
                    <div
                      className={`notion-page-header ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''} ${effectiveShowIcon && activeFileIcon ? 'has-icon' : ''}`}
                    >
                      {/* Top ghost buttons when no icon or cover exists */}
                      {((effectiveShowIcon && !activeFileIcon) ||
                        (effectiveShowCover && !activeFileBanner)) && (
                        <div className="notion-header-ghost-actions">
                          {effectiveShowIcon && !activeFileIcon && (
                            <button
                              className="notion-ghost-btn"
                              onClick={(): void => setShowEmojiPicker(true)}
                            >
                              <Smile size={13} strokeWidth={1.5} className="shrink-0 opacity-70" />
                              <span>Add icon</span>
                            </button>
                          )}
                          {effectiveShowCover && !activeFileBanner && (
                            <button
                              className="notion-ghost-btn"
                              onClick={(): void => setShowBannerPicker(true)}
                            >
                              <Image size={13} strokeWidth={1.75} className="shrink-0 opacity-70" />
                              <span>Add cover</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Page Icon Display */}
                      {effectiveShowIcon && activeFileIcon && (
                        <div
                          className={`notion-icon-container group ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''}`}
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

                    {effectiveShowFileName && (
                      <input
                        className="document-title-input"
                        type="text"
                        disabled={isPageLocked}
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
                    )}

                    <BlockEditor
                      value={fileContents[activeFilePath] || ''}
                      readOnly={isPageLocked}
                      onChange={(value): void => {
                        if (activeFilePath) {
                          const norm = normalizePath(activeFilePath)
                          setFileContents((prev) => ({
                            ...prev,
                            [activeFilePath]: value,
                            [norm]: value
                          }))
                          setLastEditedMap((prev) => ({ ...prev, [norm]: Date.now() }))
                        }
                      }}
                      activeFilePath={activeFilePath}
                      onWikilinkClick={handleWikilinkClick}
                    />
                  </div>
                </div>

                {/* Floating Stats & Autosave Pill inside Writing Area Viewport */}
                <StatusBar
                  activeFilePath={activeFilePath}
                  activeFileContent={activeFilePath ? fileContents[activeFilePath] : undefined}
                  stats={workerStats}
                  autoSaveEnabled={autoSaveEnabled}
                  activeUnsaved={activeUnsaved}
                  statsConfig={statsConfig}
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
              onDockOutline={(): void => {
                // Dock floating outline back to sidebar
                setWidgetState((prev) => ({ ...prev, outline: false }))
                setShowRightSidebar(true)
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
                  <div className="flex items-center gap-2">
                    <ListTree size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                    <span className="text-xs font-medium text-zinc-200">Outline</span>
                  </div>
                  <div className="right-sidebar-header-actions">
                    <button
                      className="right-sidebar-btn"
                      onClick={(): void => {
                        // Pop out to floating window
                        setShowRightSidebar(false)
                        setWidgetState((prev) => ({ ...prev, outline: true }))
                        bringWidgetToFront('outline')
                      }}
                      title="Pop out to floating window"
                    >
                      <AppWindow size={13} strokeWidth={1.75} />
                    </button>
                    <button
                      className="right-sidebar-btn"
                      onClick={(): void => setShowRightSidebar(false)}
                      title="Close Outline"
                    >
                      <X size={13} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
                <div className="right-sidebar-content">
                  {activeFilePath ? (
                    <OutlineWidget content={fileContents[activeFilePath] || ''} />
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
        editorFontFamily={editorFontFamily}
        editorFontSize={editorFontSize}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={handleFontSizeChange}
        enabledPlugins={enabledPlugins}
        onTogglePlugin={handleTogglePlugin}
      />
    </div>
  )
}
