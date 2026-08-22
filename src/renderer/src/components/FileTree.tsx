import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Folder,
  FolderOpen,
  Trash2,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit3,
  FilePlus,
  FolderSearch,
  FolderCog,
  Copy,
  Link,
  Check
} from 'lucide-react'
import { FileNode, ContextMenuState, MarkdownMetadata } from '../types'
import { normalizePath, getPathKey } from '../utils/pathUtils'
import { parseLocalMetadata } from '../utils/metadataUtils'
import { ProfessionalFileIcon } from '../utils/fileIconUtils'

interface FileTreeProps {
  rootPath: string
  rootName?: string
  activeFilePath: string | null
  openFiles?: { path: string; name: string }[]
  unsavedFiles?: Record<string, boolean>
  onFileSelect: (filePath: string) => void
  fileIcons?: Record<string, string>
  onMetadataLoaded?: (filePath: string, metadata: MarkdownMetadata) => void
  searchQuery?: string
  onOpenSettings?: () => void
}

function FileTree({
  rootPath,
  activeFilePath,
  unsavedFiles,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  searchQuery,
  onOpenSettings
}: FileTreeProps): React.JSX.Element {
  const normalizedRoot = useMemo(() => normalizePath(rootPath), [rootPath])
  const rootKey = useMemo(() => getPathKey(rootPath), [rootPath])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [rootKey]: true })
  const expandedRef = useRef(expanded)
  useEffect(() => {
    expandedRef.current = expanded
  }, [expanded])

  const [contents, setContents] = useState<Record<string, FileNode[]>>({})
  const [creatingType, setCreatingType] = useState<{
    parent: string
    type: 'file' | 'folder'
  } | null>(null)
  const [creatingName, setCreatingName] = useState('')
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState('')
  const [dragOverPath, setDragOverPath] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedType, setCopiedType] = useState<'path' | 'rel' | null>(null)

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // Avoid console warnings from effect dependency loops
  const onMetadataLoadedRef = useRef(onMetadataLoaded)
  useEffect(() => {
    onMetadataLoadedRef.current = onMetadataLoaded
  }, [onMetadataLoaded])

  const loadedMetadataCache = useRef<Set<string>>(new Set())

  const getRelativePath = useCallback(
    (absPath: string): string => {
      const normalizedAbs = normalizePath(absPath)
      if (normalizedAbs.toLowerCase() === normalizedRoot.toLowerCase()) {
        return '.'
      }
      return normalizedAbs.toLowerCase().startsWith(normalizedRoot.toLowerCase())
        ? normalizedAbs.slice(normalizedRoot.length).replace(/^[\\/]/, '')
        : normalizedAbs
    },
    [normalizedRoot]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, path: string, isDir: boolean, parentPath: string): void => {
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      const rect =
        target && typeof target.getBoundingClientRect === 'function'
          ? target.getBoundingClientRect()
          : null
      const menuWidth = 200
      const menuHeight = 280

      let x = e.clientX
      let y = e.clientY

      if (rect && target.tagName === 'BUTTON') {
        x = rect.right + 4
        y = rect.top - 2
      }

      // Clamp to viewport edges
      if (x + menuWidth > window.innerWidth - 8) {
        x = (rect && target.tagName === 'BUTTON' ? rect.left : e.clientX) - menuWidth - 4
      }
      if (y + menuHeight > window.innerHeight - 8) {
        y = Math.max(8, window.innerHeight - menuHeight - 8)
      }

      setContextMenu({
        x: Math.max(8, x),
        y: Math.max(8, y),
        path,
        isDir,
        parentPath
      })
    },
    []
  )

  useEffect(() => {
    const handleRootFolderEvent = (): void => {
      setCreatingType({ parent: rootPath, type: 'folder' })
      setExpanded((prev) => ({ ...prev, [rootKey]: true }))
    }
    const handleRootFileEvent = (): void => {
      setCreatingType({ parent: rootPath, type: 'file' })
      setExpanded((prev) => ({ ...prev, [rootKey]: true }))
    }
    const handleRootRenameEvent = (): void => {
      const name = rootPath.split(/[\\/]/).pop() || ''
      setRenamingPath(rootPath)
      setRenamingName(name)
    }
    const handleSidebarContextMenu = (e: Event): void => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>
      if (customEvent.detail) {
        const syntheticEvent = {
          preventDefault: (): void => {},
          stopPropagation: (): void => {},
          clientX: customEvent.detail.x,
          clientY: customEvent.detail.y,
          currentTarget: document.body
        } as unknown as React.MouseEvent
        handleContextMenu(syntheticEvent, rootPath, true, rootPath)
      }
    }

    window.addEventListener('create-root-folder', handleRootFolderEvent)
    window.addEventListener('create-root-file', handleRootFileEvent)
    window.addEventListener('rename-root-folder', handleRootRenameEvent)
    window.addEventListener('sidebar-context-menu', handleSidebarContextMenu)

    return (): void => {
      window.removeEventListener('create-root-folder', handleRootFolderEvent)
      window.removeEventListener('create-root-file', handleRootFileEvent)
      window.removeEventListener('rename-root-folder', handleRootRenameEvent)
      window.removeEventListener('sidebar-context-menu', handleSidebarContextMenu)
    }
  }, [rootPath, rootKey, handleContextMenu])

  useEffect(() => {
    const handleClose = (): void => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleClose)
    window.addEventListener('blur', handleClose)
    window.addEventListener('resize', handleClose)
    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('blur', handleClose)
      window.removeEventListener('resize', handleClose)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const loadDirectory = useCallback(async (dirPath: string): Promise<void> => {
    if (!dirPath) return
    try {
      const items = await window.api.fs.readDirectory(dirPath)
      const normalizedItems = items
        .filter((item) => !item.name.startsWith('.'))
        .map((item) => ({
          ...item,
          path: normalizePath(item.path)
        }))
      const key = getPathKey(dirPath)

      setContents((prev) => ({
        ...prev,
        [key]: normalizedItems
      }))

      // Load metadata for markdown files safely without trigger loops
      for (const item of normalizedItems) {
        if (!item.isDir && item.name.endsWith('.md')) {
          const itemKey = getPathKey(item.path)
          if (!loadedMetadataCache.current.has(itemKey)) {
            loadedMetadataCache.current.add(itemKey)
            try {
              const content = await window.api.fs.readFile(item.path)
              const meta = parseLocalMetadata(content)
              if (meta && onMetadataLoadedRef.current) {
                onMetadataLoadedRef.current(item.path, meta)
              }
            } catch {
              // Ignore read errors
            }
          }
        }
      }
    } catch (err) {
      console.error(`Failed to load directory ${dirPath}:`, err)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async (): Promise<void> => {
      if (isMounted && rootPath) {
        await loadDirectory(rootPath)
      }
    }
    void init()
    return (): void => {
      isMounted = false
    }
  }, [rootPath, loadDirectory])

  const toggleExpand = useCallback(
    async (e: React.MouseEvent, dirPath: string): Promise<void> => {
      e.stopPropagation()
      const key = getPathKey(dirPath)
      const nextState = !expanded[key]
      setExpanded((prev) => ({ ...prev, [key]: nextState }))

      if (nextState && !contents[key]) {
        await loadDirectory(dirPath)
      }
    },
    [expanded, contents, loadDirectory]
  )

  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent, parentDir: string): Promise<void> => {
      e.preventDefault()
      if (!creatingType || !creatingName.trim()) {
        setCreatingType(null)
        setCreatingName('')
        return
      }

      const name = creatingName.trim()
      try {
        if (creatingType.type === 'file') {
          const fileName = name.endsWith('.md') ? name : `${name}.md`
          const newPath = await window.api.fs.createFile(parentDir, fileName)
          onFileSelect(normalizePath(newPath))
        } else {
          await window.api.fs.createFolder(parentDir, name)
        }
        await loadDirectory(parentDir)
      } catch (err) {
        alert(`Error creating ${creatingType.type}: ${err}`)
      } finally {
        setCreatingType(null)
        setCreatingName('')
      }
    },
    [creatingType, creatingName, loadDirectory, onFileSelect]
  )

  const handleRenameSubmit = useCallback(
    async (e: React.FormEvent, oldPath: string, parentDir: string): Promise<void> => {
      e.preventDefault()
      if (!renamingName.trim()) {
        setRenamingPath(null)
        return
      }
      const newName = renamingName.trim()
      const oldName = oldPath.split(/[\\/]/).pop()
      if (newName === oldName) {
        setRenamingPath(null)
        return
      }
      const dir = oldPath.substring(
        0,
        Math.max(oldPath.lastIndexOf('/'), oldPath.lastIndexOf('\\'))
      )
      const newPath = `${dir}/${newName}`
      try {
        await window.api.fs.renamePath(oldPath, newPath)
        await loadDirectory(parentDir)
      } catch (err) {
        alert(`Error renaming: ${err}`)
      } finally {
        setRenamingPath(null)
        setRenamingName('')
      }
    },
    [renamingName, loadDirectory]
  )

  const handleDelete = useCallback(
    async (e: React.MouseEvent | null, itemPath: string, parentDir: string): Promise<void> => {
      if (e) e.stopPropagation()
      const itemName = itemPath.split(/[\\/]/).pop()
      const confirmDelete = confirm(`Are you sure you want to delete "${itemName}"?`)
      if (!confirmDelete) return

      try {
        await window.api.fs.deletePath(itemPath)
        await loadDirectory(parentDir)
      } catch (err) {
        alert(`Error deleting item: ${err}`)
      }
    },
    [loadDirectory]
  )

  const handleDragStart = useCallback((e: React.DragEvent, sourcePath: string): void => {
    e.stopPropagation()
    e.dataTransfer.setData('text/plain', sourcePath)
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((): void => {
    setIsDragging(false)
    setDragOverPath(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetParentPath: string): Promise<void> => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setDragOverPath(null)

      const sourcePath = e.dataTransfer.getData('text/plain')
      if (!sourcePath || sourcePath === targetParentPath) return

      const sourceKey = getPathKey(sourcePath)
      const targetParentKey = getPathKey(targetParentPath)

      if (sourceKey === targetParentKey) return

      const fileName = sourcePath.split(/[\\/]/).pop()
      if (!fileName) return

      const newPath = `${targetParentPath}/${fileName}`
      if (getPathKey(newPath) === sourceKey) return

      try {
        await window.api.fs.renamePath(sourcePath, newPath)
        const oldParentDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'))
        await loadDirectory(oldParentDir)
        await loadDirectory(targetParentPath)
      } catch (err) {
        alert(`Error moving file: ${err}`)
      }
    },
    [loadDirectory]
  )

  const handleContainerDrop = useCallback(
    async (e: React.DragEvent): Promise<void> => {
      await handleDrop(e, rootPath)
    },
    [handleDrop, rootPath]
  )

  const handleNewFile = useCallback((ctx: ContextMenuState): void => {
    const parentDir = ctx.isDir
      ? ctx.path
      : ctx.parentPath ||
        ctx.path.substring(0, Math.max(ctx.path.lastIndexOf('/'), ctx.path.lastIndexOf('\\')))
    setCreatingType({ parent: parentDir, type: 'file' })
    setExpanded((prev) => ({ ...prev, [getPathKey(parentDir)]: true }))
    setContextMenu(null)
  }, [])

  const handleNewFolder = useCallback((ctx: ContextMenuState): void => {
    const parentDir = ctx.isDir
      ? ctx.path
      : ctx.parentPath ||
        ctx.path.substring(0, Math.max(ctx.path.lastIndexOf('/'), ctx.path.lastIndexOf('\\')))
    setCreatingType({ parent: parentDir, type: 'folder' })
    setExpanded((prev) => ({ ...prev, [getPathKey(parentDir)]: true }))
    setContextMenu(null)
  }, [])

  const handleRevealInExplorer = useCallback(
    async (targetPath: string): Promise<void> => {
      const p = targetPath || rootPath
      try {
        if (window.api?.fs?.showItemInFolder) {
          await window.api.fs.showItemInFolder(p)
        }
      } catch (err) {
        console.error('Failed to reveal in file explorer:', err)
      }
      setContextMenu(null)
    },
    [rootPath]
  )

  const handleOpenFolderSettings = useCallback(
    (targetPath: string): void => {
      setContextMenu(null)
      if (onOpenSettings) {
        onOpenSettings()
      } else {
        window.dispatchEvent(
          new CustomEvent('open-folder-settings', { detail: { path: targetPath || rootPath } })
        )
      }
    },
    [onOpenSettings, rootPath]
  )

  const handleCopyPath = useCallback(
    async (targetPath: string): Promise<void> => {
      const p = targetPath || rootPath
      try {
        await navigator.clipboard.writeText(p)
        setCopiedType('path')
        setTimeout(() => {
          setCopiedType(null)
          setContextMenu(null)
        }, 350)
      } catch (err) {
        console.error('Failed to copy path:', err)
        setContextMenu(null)
      }
    },
    [rootPath]
  )

  const handleCopyRelativePath = useCallback(
    async (targetPath: string): Promise<void> => {
      const p = targetPath || rootPath
      const rel = getRelativePath(p)
      try {
        await navigator.clipboard.writeText(rel)
        setCopiedType('rel')
        setTimeout(() => {
          setCopiedType(null)
          setContextMenu(null)
        }, 350)
      } catch (err) {
        console.error('Failed to copy relative path:', err)
        setContextMenu(null)
      }
    },
    [rootPath, getRelativePath]
  )

  const renderNode = (node: FileNode, parentPath: string): React.JSX.Element | null => {
    const nodeKey = getPathKey(node.path)
    const isSelected = activeFilePath && getPathKey(activeFilePath) === nodeKey

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      if (!node.isDir && !node.name.toLowerCase().includes(q)) {
        return null
      }
    }

    if (node.isDir) {
      const isNodeExpanded = expanded[nodeKey]
      const children = contents[nodeKey] || []

      return (
        <div key={nodeKey} className="tree-node">
          <div
            className={`tree-node-item group ${isNodeExpanded ? 'expanded-folder' : ''}`}
            onClick={(e): void => {
              void toggleExpand(e, node.path)
            }}
            onContextMenu={(e): void => handleContextMenu(e, node.path, true, parentPath)}
            draggable={node.path !== rootPath}
            onDragStart={(e): void => handleDragStart(e, node.path)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(): void => setDragOverPath(nodeKey)}
            onDrop={(e): void => void handleDrop(e, node.path)}
          >
            <span className="tree-node-left">
              <span className="tree-node-chevron shrink-0">
                {isNodeExpanded ? (
                  <ChevronDown size={11} strokeWidth={2.2} />
                ) : (
                  <ChevronRight size={11} strokeWidth={2.2} />
                )}
              </span>
              {isNodeExpanded ? (
                <FolderOpen size={14} className="text-zinc-400 shrink-0" />
              ) : (
                <Folder size={14} className="text-zinc-400 shrink-0" />
              )}
              {renamingPath === node.path ? (
                <form
                  onSubmit={(e): Promise<void> => handleRenameSubmit(e, node.path, parentPath)}
                  onClick={(e): void => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    className="input-inline"
                    type="text"
                    value={renamingName}
                    onChange={(e): void => setRenamingName(e.target.value)}
                    onBlur={(e): void => {
                      void handleRenameSubmit(e, node.path, parentPath)
                    }}
                  />
                </form>
              ) : (
                <span className="tree-node-label">{node.name}</span>
              )}
            </span>
            <span className="tree-node-right opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="tree-node-action-btn"
                onClick={(e): void => {
                  e.stopPropagation()
                  setCreatingType({ parent: node.path, type: 'file' })
                  setExpanded((prev) => ({ ...prev, [nodeKey]: true }))
                }}
                title="Add page inside"
              >
                <Plus size={12} />
              </button>
              <button
                className="tree-node-action-btn"
                onClick={(e): void => {
                  e.stopPropagation()
                  handleContextMenu(e, node.path, true, parentPath)
                }}
                title="Folder Options"
              >
                <MoreHorizontal size={12} />
              </button>
            </span>
          </div>

          {isNodeExpanded && (
            <div className="tree-node-children">
              {creatingType && getPathKey(creatingType.parent) === nodeKey && (
                <form
                  onSubmit={(e): Promise<void> => handleCreateSubmit(e, node.path)}
                  className="tree-create-form"
                >
                  <input
                    autoFocus
                    className="input-inline"
                    type="text"
                    value={creatingName}
                    placeholder={`New ${creatingType.type}...`}
                    onChange={(e): void => setCreatingName(e.target.value)}
                    onBlur={(): void => {
                      setCreatingType(null)
                      setCreatingName('')
                    }}
                  />
                </form>
              )}
              {children.map((child) => renderNode(child, node.path))}
            </div>
          )}
        </div>
      )
    }

    const relPath = getRelativePath(node.path).toLowerCase()
    const customIcon = fileIcons ? fileIcons[relPath] : undefined

    const fileClasses = [
      'tree-node-item group',
      isSelected ? 'active' : '',
      dragOverPath === nodeKey ? 'drag-over-file' : ''
    ]
      .filter(Boolean)
      .join(' ')

    const isUnsaved = unsavedFiles
      ? !!unsavedFiles[nodeKey] ||
        !!unsavedFiles[node.path] ||
        !!unsavedFiles[normalizePath(node.path)]
      : false

    return (
      <div key={nodeKey} className="tree-node">
        <div
          className={fileClasses}
          onClick={(): void => onFileSelect(node.path)}
          onContextMenu={(e): void => handleContextMenu(e, node.path, false, parentPath)}
          draggable={true}
          onDragStart={(e): void => handleDragStart(e, node.path)}
          onDragEnd={handleDragEnd}
        >
          <span className="tree-node-left">
            {customIcon ? (
              <span className="tree-node-emoji-icon">{customIcon}</span>
            ) : (
              <ProfessionalFileIcon fileName={node.name} />
            )}
            {renamingPath === node.path ? (
              <form
                onSubmit={(e): Promise<void> => handleRenameSubmit(e, node.path, parentPath)}
                onClick={(e): void => e.stopPropagation()}
              >
                <input
                  autoFocus
                  className="input-inline"
                  type="text"
                  value={renamingName}
                  onChange={(e): void => setRenamingName(e.target.value)}
                  onBlur={(e): void => {
                    void handleRenameSubmit(e, node.path, parentPath)
                  }}
                />
              </form>
            ) : (
              <span className="tree-node-label">{node.name}</span>
            )}
          </span>
          <span className="tree-node-right">
            {isUnsaved && <span className="tree-node-active-dot" title="Unsaved changes" />}
            <button
              className="tree-node-action-btn opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e): void => {
                e.stopPropagation()
                handleContextMenu(e, node.path, false, parentPath)
              }}
              title="Page Options"
            >
              <MoreHorizontal size={12} />
            </button>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`file-tree-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleContainerDrop}
      onContextMenu={(e): void => {
        handleContextMenu(e, rootPath, true, rootPath)
      }}
    >
      {creatingType && getPathKey(creatingType.parent) === rootKey && (
        <form
          onSubmit={(e): Promise<void> => handleCreateSubmit(e, rootPath)}
          className="tree-create-form"
        >
          <input
            autoFocus
            className="input-inline"
            type="text"
            value={creatingName}
            placeholder={`New ${creatingType.type}...`}
            onChange={(e): void => setCreatingName(e.target.value)}
            onBlur={(): void => {
              setCreatingType(null)
              setCreatingName('')
            }}
          />
        </form>
      )}
      {(contents[rootKey] || []).map((node) => renderNode(node, rootPath))}

      {contextMenu &&
        createPortal(
          <div
            className="context-menu-popover"
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            onClick={(e): void => e.stopPropagation()}
          >
            <div className="context-menu-header">
              {contextMenu.path
                ? contextMenu.path.split(/[\\/]/).filter(Boolean).pop() || 'Workspace'
                : 'Workspace'}
            </div>

            {/* 1. New File */}
            <button className="context-menu-item" onClick={(): void => handleNewFile(contextMenu)}>
              <FilePlus size={13} />
              <span>New File</span>
            </button>

            {/* 2. New Folder */}
            <button
              className="context-menu-item"
              onClick={(): void => handleNewFolder(contextMenu)}
            >
              <FolderPlus size={13} />
              <span>New Folder</span>
            </button>

            <div className="context-menu-divider" />

            {/* 3. Reveal in File Explorer */}
            <button
              className="context-menu-item"
              onClick={(): void => void handleRevealInExplorer(contextMenu.path)}
            >
              <FolderSearch size={13} />
              <span>Reveal in File Explorer</span>
            </button>

            {/* 4. Open Folder Settings */}
            <button
              className="context-menu-item"
              onClick={(): void => handleOpenFolderSettings(contextMenu.path)}
            >
              <FolderCog size={13} />
              <span>Open Folder Settings</span>
            </button>

            <div className="context-menu-divider" />

            {/* 5. Copy Path */}
            <button
              className="context-menu-item"
              onClick={(): void => void handleCopyPath(contextMenu.path)}
              style={{ justifyContent: 'space-between' }}
            >
              <span className="flex items-center gap-2">
                <Copy size={13} />
                <span>Copy Path</span>
              </span>
              {copiedType === 'path' && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontWeight: 500
                  }}
                >
                  <Check size={10} /> Copied
                </span>
              )}
            </button>

            {/* 6. Copy Relative Path */}
            <button
              className="context-menu-item"
              onClick={(): void => void handleCopyRelativePath(contextMenu.path)}
              style={{ justifyContent: 'space-between' }}
            >
              <span className="flex items-center gap-2">
                <Link size={13} />
                <span>Copy Relative Path</span>
              </span>
              {copiedType === 'rel' && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontWeight: 500
                  }}
                >
                  <Check size={10} /> Copied
                </span>
              )}
            </button>

            {/* Optional Rename & Delete actions for non-root items */}
            {contextMenu.path && getPathKey(contextMenu.path) !== rootKey && (
              <>
                <div className="context-menu-divider" />
                <button
                  className="context-menu-item"
                  onClick={(): void => {
                    const name = contextMenu.path.split(/[\\/]/).pop() || ''
                    setRenamingPath(contextMenu.path)
                    setRenamingName(name)
                    setContextMenu(null)
                  }}
                >
                  <Edit3 size={13} />
                  <span>Rename</span>
                </button>
                <button
                  className="context-menu-item danger"
                  onClick={(): void => {
                    handleDelete(null, contextMenu.path, contextMenu.parentPath)
                    setContextMenu(null)
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete {contextMenu.isDir ? 'Folder' : 'File'}</span>
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

export default React.memo(FileTree)
