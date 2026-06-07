import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Folder,
  FolderOpen,
  File,
  Trash2,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'

interface FileNode {
  name: string
  path: string
  isDir: boolean
}

const normalizePath = (p: string): string => {
  if (!p) return p
  let normalized = p.replace(/\\/g, '/')
  if (normalized.match(/^[A-Za-z]:/)) {
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1)
  }
  return normalized
}

const getPathKey = (p: string): string => {
  return normalizePath(p).toLowerCase()
}

function parseLocalMetadata(fileContent: string): { icon?: string; banner?: string } | null {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return null

  const frontmatter = match[1]
  const metadata: { icon?: string; banner?: string } = {}
  const lines = frontmatter.split(/\r?\n/)
  for (const line of lines) {
    const parts = line.split(':')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join(':').trim()
      if (key === 'icon') {
        metadata.icon = value.replace(/^['"]|['"]$/g, '')
      } else if (key === 'banner') {
        metadata.banner = value.replace(/^['"]|['"]$/g, '')
      }
    }
  }
  return metadata
}

interface FileTreeProps {
  rootPath: string
  rootName: string
  activeFilePath: string | null
  onFileSelect: (filePath: string) => void
  fileIcons?: Record<string, string>
  onMetadataLoaded?: (filePath: string, metadata: { icon?: string; banner?: string }) => void
}

export default function FileTree({
  rootPath,
  rootName,
  activeFilePath,
  onFileSelect,
  fileIcons,
  onMetadataLoaded
}: FileTreeProps): React.JSX.Element {
  const normalizedRoot = normalizePath(rootPath)
  const rootKey = getPathKey(rootPath)

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
  const [dragOverPath, setDragOverPath] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  interface ContextMenuState {
    x: number
    y: number
    path: string
    isDir: boolean
    parentPath: string
  }

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, path: string, isDir: boolean, parentPath: string): void => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        path: normalizePath(path),
        isDir,
        parentPath: normalizePath(parentPath)
      })
    },
    [setContextMenu]
  )

  const handleThreeDotsClick = useCallback(
    (e: React.MouseEvent, path: string, isDir: boolean, parentPath: string): void => {
      e.stopPropagation()
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      setContextMenu({
        x: rect.left,
        y: rect.bottom + 4,
        path: normalizePath(path),
        isDir,
        parentPath: normalizePath(parentPath)
      })
    },
    [setContextMenu]
  )

  useEffect(() => {
    const handleOutsideClick = (): void => {
      setContextMenu(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return (): void => window.removeEventListener('click', handleOutsideClick)
  }, [setContextMenu])

  // Load directory children
  const loadDirectory = useCallback(
    async (dirPath: string): Promise<void> => {
      try {
        const rawChildren = await window.api.fs.readDirectory(dirPath)
        const dirKey = getPathKey(dirPath)
        // Only keep directories and markdown files
        const children = rawChildren
          .filter((child) => child.isDir || child.name.endsWith('.md'))
          .map((child) => ({ ...child, path: normalizePath(child.path) }))
        setContents((prev) => ({ ...prev, [dirKey]: children }))

        if (onMetadataLoaded) {
          for (const child of children) {
            if (!child.isDir && child.name.endsWith('.md')) {
              try {
                const fileContent = await window.api.fs.readFile(child.path)
                const metadata = parseLocalMetadata(fileContent)
                if (metadata && (metadata.icon || metadata.banner)) {
                  onMetadataLoaded(child.path, metadata)
                }
              } catch (err) {
                console.error('Failed to read metadata for file', child.path, err)
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load directory:', dirPath, err)
      }
    },
    [onMetadataLoaded]
  )

  // Reload the tree whenever rootPath changes
  useEffect(() => {
    let active = true
    if (rootPath) {
      const rootKey = getPathKey(rootPath)
      window.api.fs
        .readDirectory(rootPath)
        .then(async (rawChildren) => {
          if (active) {
            // Only keep directories and markdown files
            const children = rawChildren
              .filter((child) => child.isDir || child.name.endsWith('.md'))
              .map((child) => ({ ...child, path: normalizePath(child.path) }))
            setContents((prev) => ({ ...prev, [rootKey]: children }))
            setExpanded({ [rootKey]: true })

            if (onMetadataLoaded) {
              for (const child of children) {
                if (!child.isDir && child.name.endsWith('.md')) {
                  try {
                    const fileContent = await window.api.fs.readFile(child.path)
                    const metadata = parseLocalMetadata(fileContent)
                    if (metadata && (metadata.icon || metadata.banner)) {
                      onMetadataLoaded(child.path, metadata)
                    }
                  } catch (err) {
                    console.error('Failed to read metadata for file', child.path, err)
                  }
                }
              }
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load directory:', rootPath, err)
        })
    }
    return (): void => {
      active = false
    }
  }, [rootPath, onMetadataLoaded])

  // Listen to workspace changes to refresh directories dynamically
  useEffect(() => {
    if (!rootPath) return

    const unsubscribe = window.api.fs.onWorkspaceChanged(async (data) => {
      const parentKey = getPathKey(data.parentPath)
      const rootKey = getPathKey(rootPath)
      // Refresh directory if it is rootPath, or if it is currently expanded
      if (parentKey === rootKey || expandedRef.current[parentKey]) {
        await loadDirectory(data.parentPath)
      }
    })

    return (): void => {
      unsubscribe()
    }
  }, [rootPath, loadDirectory])

  // Helper to toggle expand status
  const toggleExpand = async (dirPath: string): Promise<void> => {
    const dirKey = getPathKey(dirPath)
    const isExpanded = !!expanded[dirKey]
    setExpanded((prev) => ({ ...prev, [dirKey]: !isExpanded }))

    // Fetch if expanding and not loaded yet
    if (!isExpanded && !contents[dirKey]) {
      await loadDirectory(dirPath)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent, parentPath: string): Promise<void> => {
    e.preventDefault()
    if (!creatingName.trim() || !creatingType) return

    try {
      if (creatingType.type === 'file') {
        let name = creatingName.trim()
        if (!name.endsWith('.md')) {
          name += '.md'
        }
        const newPath = await window.api.fs.createFile(parentPath, name)
        await loadDirectory(parentPath)
        onFileSelect(normalizePath(newPath))
      } else {
        await window.api.fs.createFolder(parentPath, creatingName.trim())
        await loadDirectory(parentPath)
        // Auto expand parent
        setExpanded((prev) => ({ ...prev, [getPathKey(parentPath)]: true }))
      }
      setCreatingType(null)
      setCreatingName('')
    } catch (err) {
      alert(`Error creating item: ${err}`)
    }
  }

  const handleDelete = async (
    e: React.MouseEvent | null,
    itemPath: string,
    parentPath: string
  ): Promise<void> => {
    if (e) e.stopPropagation()
    if (confirm(`Are you sure you want to delete ${itemPath}?`)) {
      try {
        await window.api.fs.deletePath(itemPath)
        await loadDirectory(parentPath)
      } catch (err) {
        alert(`Error deleting item: ${err}`)
      }
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, path: string): void => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', path)
  }

  const handleDragEnd = (): void => {
    setIsDragging(false)
    setDragOverPath(null)
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetParentPath: string): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragOverPath(null)

    const sourcePath = e.dataTransfer.getData('text/plain')
    if (!sourcePath) return

    const sourceKey = getPathKey(sourcePath)
    const targetParentKey = getPathKey(targetParentPath)

    if (sourceKey === targetParentKey) return

    // Prevent dragging a folder inside its own subfolders
    if (targetParentKey.startsWith(sourceKey + '/')) {
      alert('Cannot move a folder into its own subfolder.')
      return
    }

    const name = sourcePath.split(/[\\/]/).pop()!
    const separator = sourcePath.includes('\\') ? '\\' : '/'
    const newPath =
      targetParentPath + (targetParentPath.endsWith(separator) ? '' : separator) + name
    const newPathKey = getPathKey(newPath)

    if (sourceKey === newPathKey) return

    try {
      await window.api.fs.renamePath(sourcePath, newPath)

      const getParentPath = (p: string): string => {
        const lastIndex = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
        return lastIndex !== -1 ? p.substring(0, lastIndex) : p
      }

      const sourceParent = getParentPath(sourcePath)
      await loadDirectory(sourceParent)
      await loadDirectory(targetParentPath)

      if (activeFilePath && getPathKey(activeFilePath) === sourceKey) {
        onFileSelect(normalizePath(newPath))
      }
    } catch (err) {
      alert(`Failed to move item: ${err}`)
    }
  }

  const handleContainerDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    setIsDragging(false)
    setDragOverPath(null)
    await handleDrop(e, rootPath)
  }

  // Recursive Tree Node Renderer
  const renderNode = (node: FileNode, parentPath: string): React.JSX.Element => {
    const nodeKey = getPathKey(node.path)
    const isNodeExpanded = !!expanded[nodeKey]
    const isSelected = activeFilePath ? getPathKey(activeFilePath) === nodeKey : false
    const children = contents[nodeKey] || []

    if (node.isDir) {
      return (
        <div key={nodeKey} className="tree-node">
          <div
            className={`tree-node-item ${isSelected ? 'active' : ''} ${dragOverPath === nodeKey ? 'drag-over' : ''}`}
            onClick={(): void => {
              toggleExpand(node.path)
            }}
            onContextMenu={(e): void => {
              handleContextMenu(e, node.path, true, parentPath)
            }}
            draggable={node.path !== rootPath}
            onDragStart={(e): void => handleDragStart(e, node.path)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e): void => {
              e.preventDefault()
              setDragOverPath(nodeKey)
            }}
            onDragLeave={(): void => {
              setDragOverPath(null)
            }}
            onDrop={(e): Promise<void> => {
              setDragOverPath(null)
              setIsDragging(false)
              return handleDrop(e, node.path)
            }}
          >
            <span className="tree-node-left">
              {isNodeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isNodeExpanded ? (
                <FolderOpen size={16} fill="#48a37e" style={{ color: '#48a37e' }} />
              ) : (
                <Folder size={16} fill="#48a37e" style={{ color: '#48a37e' }} />
              )}
              <span>{node.name}</span>
            </span>

            <span className="tree-node-actions">
              <button
                className="tree-node-action-btn"
                title="Options"
                onClick={(e): void => {
                  handleThreeDotsClick(e, node.path, true, parentPath)
                }}
              >
                <MoreHorizontal size={12} />
              </button>
            </span>
          </div>

          {isNodeExpanded && (
            <div className="tree-node-children">
              {/* Inline input for creating file/folder */}
              {creatingType && getPathKey(creatingType.parent) === nodeKey && (
                <form
                  onSubmit={(e): Promise<void> => handleCreateSubmit(e, node.path)}
                  style={{ padding: '4px 8px 4px 28px' }}
                >
                  <input
                    autoFocus
                    className="input-inline"
                    type="text"
                    value={creatingName}
                    placeholder={`New ${creatingType.type} name...`}
                    onChange={(e): void => setCreatingName(e.target.value)}
                    onBlur={(): void => {
                      setTimeout(() => {
                        setCreatingType(null)
                        setCreatingName('')
                      }, 100)
                    }}
                    onKeyDown={(e): void => {
                      if (e.key === 'Escape') {
                        setCreatingType(null)
                        setCreatingName('')
                      }
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

    // File Node
    const getRelativePath = (absPath: string): string => {
      const normalizedAbs = normalizePath(absPath)
      return normalizedAbs.toLowerCase().startsWith(normalizedRoot.toLowerCase())
        ? normalizedAbs.slice(normalizedRoot.length).replace(/^[\\/]/, '')
        : normalizedAbs
    }
    const relPath = getRelativePath(node.path).toLowerCase()
    const customIcon = fileIcons ? fileIcons[relPath] : undefined

    return (
      <div key={nodeKey} className="tree-node">
        <div
          className={`tree-node-item ${isSelected ? 'active' : ''} ${dragOverPath === nodeKey ? 'drag-over-file' : ''}`}
          onClick={(): void => onFileSelect(node.path)}
          onContextMenu={(e): void => {
            handleContextMenu(e, node.path, false, parentPath)
          }}
          draggable={true}
          onDragStart={(e): void => handleDragStart(e, node.path)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={(e): void => {
            e.preventDefault()
            setDragOverPath(nodeKey)
          }}
          onDragLeave={(): void => {
            setDragOverPath(null)
          }}
          onDrop={(e): Promise<void> => {
            setDragOverPath(null)
            setIsDragging(false)
            return handleDrop(e, parentPath)
          }}
        >
          <span className="tree-node-left">
            <span style={{ width: 14 }} /> {/* Indent matches chevron space */}
            {customIcon ? (
              <span className="tree-node-emoji-icon">{customIcon}</span>
            ) : (
              <File size={16} fill="#a0aec0" style={{ color: '#a0aec0' }} />
            )}
            <span>{node.name}</span>
          </span>

          <span className="tree-node-actions">
            <button
              className="tree-node-action-btn"
              title="Options"
              onClick={(e): void => {
                handleThreeDotsClick(e, node.path, false, parentPath)
              }}
            >
              <MoreHorizontal size={12} />
            </button>
          </span>
        </div>
      </div>
    )
  }

  // Root layout
  return (
    <div
      className={`file-tree-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleContainerDrop}
    >
      {/* Root Node Header Actions */}
      <div
        className={`tree-node-item active-root ${dragOverPath === rootKey ? 'drag-over' : ''}`}
        style={{ fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--border-color)' }}
        onContextMenu={(e): void => {
          handleContextMenu(e, rootPath, true, rootPath)
        }}
        onDragOver={handleDragOver}
        onDragEnter={(e): void => {
          e.preventDefault()
          setDragOverPath(rootKey)
        }}
        onDragLeave={(): void => {
          setDragOverPath(null)
        }}
        onDrop={(e): Promise<void> => {
          setDragOverPath(null)
          setIsDragging(false)
          return handleDrop(e, rootPath)
        }}
      >
        <span className="tree-node-left" onClick={(): Promise<void> => toggleExpand(rootPath)}>
          {expanded[rootKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FolderOpen size={16} fill="#48a37e" style={{ color: '#48a37e' }} />
          <span>{rootName}</span>
        </span>
        <span className="tree-node-actions">
          <button
            className="tree-node-action-btn"
            title="Options"
            onClick={(e): void => {
              handleThreeDotsClick(e, rootPath, true, rootPath)
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        </span>
      </div>

      <div style={{ marginTop: '8px' }}>
        {expanded[rootKey] && (
          <div className="tree-node-children">
            {creatingType && getPathKey(creatingType.parent) === rootKey && (
              <form
                onSubmit={(e): Promise<void> => handleCreateSubmit(e, rootPath)}
                style={{ padding: '4px 8px 4px 28px' }}
              >
                <input
                  autoFocus
                  className="input-inline"
                  type="text"
                  value={creatingName}
                  placeholder={`New ${creatingType.type} name...`}
                  onChange={(e): void => setCreatingName(e.target.value)}
                  onBlur={(): void => {
                    setTimeout(() => {
                      setCreatingType(null)
                      setCreatingName('')
                    }, 100)
                  }}
                  onKeyDown={(e): void => {
                    if (e.key === 'Escape') {
                      setCreatingType(null)
                      setCreatingName('')
                    }
                  }}
                />
              </form>
            )}
            {(contents[rootKey] || []).map((node) => renderNode(node, rootPath))}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="context-menu-popover"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e): void => e.stopPropagation()}
        >
          {contextMenu.isDir && (
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
            </>
          )}

          {getPathKey(contextMenu.path) !== rootKey && (
            <>
              {contextMenu.isDir && <div className="context-menu-divider" />}
              <button
                className="context-menu-item danger"
                onClick={(): void => {
                  handleDelete(null, contextMenu.path, contextMenu.parentPath)
                  setContextMenu(null)
                }}
              >
                <Trash2 size={12} />
                <span>Delete {contextMenu.isDir ? 'Folder' : 'File'}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
