import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Folder,
  FolderOpen,
  Trash2,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit3
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
  onFileSelect: (filePath: string) => void
  fileIcons?: Record<string, string>
  onMetadataLoaded?: (filePath: string, metadata: MarkdownMetadata) => void
  searchQuery?: string
}

function FileTree({
  rootPath,
  activeFilePath,
  openFiles,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  searchQuery
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // Avoid console warnings from effect dependency loops
  const onMetadataLoadedRef = useRef(onMetadataLoaded)
  useEffect(() => {
    onMetadataLoadedRef.current = onMetadataLoaded
  }, [onMetadataLoaded])

  const loadedMetadataCache = useRef<Set<string>>(new Set())

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, path: string, isDir: boolean, parentPath: string): void => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
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
    window.addEventListener('create-root-folder', handleRootFolderEvent)
    window.addEventListener('create-root-file', handleRootFileEvent)
    window.addEventListener('rename-root-folder', handleRootRenameEvent)
    return (): void => {
      window.removeEventListener('create-root-folder', handleRootFolderEvent)
      window.removeEventListener('create-root-file', handleRootFileEvent)
      window.removeEventListener('rename-root-folder', handleRootRenameEvent)
    }
  }, [rootPath, rootKey])

  useEffect(() => {
    const handleClickOutside = (): void => setContextMenu(null)
    window.addEventListener('click', handleClickOutside)
    return (): void => window.removeEventListener('click', handleClickOutside)
  }, [])

  const loadDirectory = useCallback(async (dirPath: string): Promise<void> => {
    if (!dirPath) return
    try {
      const items = await window.api.fs.readDirectory(dirPath)
      const normalizedItems = items.map((item) => ({
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

  useEffect(() => {
    const handleGlobalClick = (): void => setContextMenu(null)
    window.addEventListener('click', handleGlobalClick)
    return (): void => window.removeEventListener('click', handleGlobalClick)
  }, [])

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
              {isNodeExpanded ? (
                <FolderOpen size={14} fill="currentColor" className="text-zinc-200 shrink-0" />
              ) : (
                <Folder size={14} fill="currentColor" className="text-zinc-400 shrink-0" />
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
              <button
                className="tree-node-dots-btn opacity-0 group-hover:opacity-100 p-0.5 hover:text-white text-zinc-400 rounded transition-all"
                onClick={(e): void => {
                  e.stopPropagation()
                  handleContextMenu(e, node.path, true, parentPath)
                }}
                title="Folder Options"
              >
                <MoreHorizontal size={13} />
              </button>
              <span className="tree-node-chevron">
                {isNodeExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
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

    const getRelativePath = (absPath: string): string => {
      const normalizedAbs = normalizePath(absPath)
      return normalizedAbs.toLowerCase().startsWith(normalizedRoot.toLowerCase())
        ? normalizedAbs.slice(normalizedRoot.length).replace(/^[\\/]/, '')
        : normalizedAbs
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

    const isOpen = openFiles ? openFiles.some((f) => getPathKey(f.path) === nodeKey) : false
    const showDot = isSelected || isOpen

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
            {showDot && <span className="tree-node-active-dot" />}
            <button
              className="tree-node-dots-btn opacity-0 group-hover:opacity-100 p-0.5 hover:text-white text-zinc-400 rounded transition-all"
              onClick={(e): void => {
                e.stopPropagation()
                handleContextMenu(e, node.path, false, parentPath)
              }}
              title="File Options"
            >
              <MoreHorizontal size={13} />
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

      {contextMenu && (
        <div
          className="context-menu-popover"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e): void => e.stopPropagation()}
        >
          {contextMenu.isDir ? (
            <>
              <button
                className="context-menu-item"
                onClick={(): void => {
                  setCreatingType({ parent: contextMenu.path, type: 'file' })
                  setExpanded((prev) => ({ ...prev, [getPathKey(contextMenu.path)]: true }))
                  setContextMenu(null)
                }}
              >
                <Plus size={12} />
                <span>New File</span>
              </button>
              <button
                className="context-menu-item"
                onClick={(): void => {
                  setCreatingType({ parent: contextMenu.path, type: 'folder' })
                  setExpanded((prev) => ({ ...prev, [getPathKey(contextMenu.path)]: true }))
                  setContextMenu(null)
                }}
              >
                <FolderPlus size={12} />
                <span>New Folder</span>
              </button>
              {getPathKey(contextMenu.path) !== rootKey && (
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
                    <Edit3 size={12} />
                    <span>Rename</span>
                  </button>
                  <button
                    className="context-menu-item danger"
                    onClick={(): void => {
                      handleDelete(null, contextMenu.path, contextMenu.parentPath)
                      setContextMenu(null)
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Delete Folder</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                className="context-menu-item"
                onClick={(): void => {
                  const name = contextMenu.path.split(/[\\/]/).pop() || ''
                  setRenamingPath(contextMenu.path)
                  setRenamingName(name)
                  setContextMenu(null)
                }}
              >
                <Edit3 size={12} />
                <span>Rename</span>
              </button>
              <div className="context-menu-divider" />
              <button
                className="context-menu-item danger"
                onClick={(): void => {
                  handleDelete(null, contextMenu.path, contextMenu.parentPath)
                  setContextMenu(null)
                }}
              >
                <Trash2 size={12} />
                <span>Delete File</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(FileTree)
