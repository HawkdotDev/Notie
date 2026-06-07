import React, { useState, useEffect, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  File,
  Trash2,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

interface FileNode {
  name: string
  path: string
  isDir: boolean
}

interface FileTreeProps {
  rootPath: string
  rootName: string
  activeFilePath: string | null
  onFileSelect: (filePath: string) => void
}

export default function FileTree({
  rootPath,
  rootName,
  activeFilePath,
  onFileSelect
}: FileTreeProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [rootPath]: true })
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

  // Load directory children
  const loadDirectory = async (dirPath: string): Promise<void> => {
    try {
      const children = await window.api.fs.readDirectory(dirPath)
      setContents((prev) => ({ ...prev, [dirPath]: children }))
    } catch (err) {
      console.error('Failed to load directory:', dirPath, err)
    }
  }

  // Reload the tree whenever rootPath changes
  useEffect(() => {
    let active = true
    if (rootPath) {
      window.api.fs
        .readDirectory(rootPath)
        .then((children) => {
          if (active) {
            setContents((prev) => ({ ...prev, [rootPath]: children }))
            setExpanded({ [rootPath]: true })
          }
        })
        .catch((err) => {
          console.error('Failed to load directory:', rootPath, err)
        })
    }
    return (): void => {
      active = false
    }
  }, [rootPath])

  // Listen to workspace changes to refresh directories dynamically
  useEffect(() => {
    if (!rootPath) return

    const unsubscribe = window.api.fs.onWorkspaceChanged(async (data) => {
      // Refresh directory if it is rootPath, or if it is currently expanded
      if (data.parentPath === rootPath || expandedRef.current[data.parentPath]) {
        await loadDirectory(data.parentPath)
      }
    })

    return (): void => {
      unsubscribe()
    }
  }, [rootPath])

  // Helper to toggle expand status
  const toggleExpand = async (dirPath: string): Promise<void> => {
    const isExpanded = !!expanded[dirPath]
    setExpanded((prev) => ({ ...prev, [dirPath]: !isExpanded }))

    // Fetch if expanding and not loaded yet
    if (!isExpanded && !contents[dirPath]) {
      await loadDirectory(dirPath)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent, parentPath: string): Promise<void> => {
    e.preventDefault()
    if (!creatingName.trim() || !creatingType) return

    try {
      if (creatingType.type === 'file') {
        const newPath = await window.api.fs.createFile(parentPath, creatingName.trim())
        await loadDirectory(parentPath)
        onFileSelect(newPath)
      } else {
        await window.api.fs.createFolder(parentPath, creatingName.trim())
        await loadDirectory(parentPath)
        // Auto expand parent
        setExpanded((prev) => ({ ...prev, [parentPath]: true }))
      }
      setCreatingType(null)
      setCreatingName('')
    } catch (err) {
      alert(`Error creating item: ${err}`)
    }
  }

  const handleDelete = async (
    e: React.MouseEvent,
    itemPath: string,
    parentPath: string
  ): Promise<void> => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete ${itemPath}?`)) {
      try {
        await window.api.fs.deletePath(itemPath)
        await loadDirectory(parentPath)
      } catch (err) {
        alert(`Error deleting item: ${err}`)
      }
    }
  }

  // Recursive Tree Node Renderer
  const renderNode = (node: FileNode, parentPath: string): React.JSX.Element => {
    const isNodeExpanded = !!expanded[node.path]
    const isSelected = activeFilePath === node.path
    const children = contents[node.path] || []

    if (node.isDir) {
      return (
        <div key={node.path} className="tree-node">
          <div
            className={`tree-node-item ${isSelected ? 'active' : ''}`}
            onClick={(): void => {
              toggleExpand(node.path)
            }}
          >
            <span className="tree-node-left">
              {isNodeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isNodeExpanded ? (
                <FolderOpen size={16} style={{ color: '#48a37e' }} />
              ) : (
                <Folder size={16} style={{ color: '#48a37e' }} />
              )}
              <span>{node.name}</span>
            </span>

            <span className="tree-node-actions">
              <button
                className="tree-node-action-btn"
                title="New File"
                onClick={(e): void => {
                  e.stopPropagation()
                  setCreatingType({ parent: node.path, type: 'file' })
                  setExpanded((prev) => ({ ...prev, [node.path]: true }))
                }}
              >
                <Plus size={12} />
              </button>
              <button
                className="tree-node-action-btn"
                title="New Folder"
                onClick={(e): void => {
                  e.stopPropagation()
                  setCreatingType({ parent: node.path, type: 'folder' })
                  setExpanded((prev) => ({ ...prev, [node.path]: true }))
                }}
              >
                <FolderPlus size={12} />
              </button>
              {node.path !== rootPath && (
                <button
                  className="tree-node-action-btn"
                  title="Delete Folder"
                  onClick={(e): void => {
                    handleDelete(e, node.path, parentPath)
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </span>
          </div>

          {isNodeExpanded && (
            <div className="tree-node-children">
              {/* Inline input for creating file/folder */}
              {creatingType && creatingType.parent === node.path && (
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

    // File Node
    return (
      <div key={node.path} className="tree-node">
        <div
          className={`tree-node-item ${isSelected ? 'active' : ''}`}
          onClick={(): void => onFileSelect(node.path)}
        >
          <span className="tree-node-left">
            <span style={{ width: 14 }} /> {/* Indent matches chevron space */}
            <File size={16} style={{ color: '#a0aec0' }} />
            <span>{node.name}</span>
          </span>

          <span className="tree-node-actions">
            <button
              className="tree-node-action-btn"
              title="Delete File"
              onClick={(e): void => {
                handleDelete(e, node.path, parentPath)
              }}
            >
              <Trash2 size={12} />
            </button>
          </span>
        </div>
      </div>
    )
  }

  // Root layout
  return (
    <div className="file-tree-container">
      {/* Root Node Header Actions */}
      <div
        className="tree-node-item active-root"
        style={{ fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--border-color)' }}
      >
        <span className="tree-node-left" onClick={(): Promise<void> => toggleExpand(rootPath)}>
          {expanded[rootPath] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FolderOpen size={16} style={{ color: '#48a37e' }} />
          <span>{rootName}</span>
        </span>
        <span className="tree-node-actions" style={{ display: 'flex' }}>
          <button
            className="tree-node-action-btn"
            title="New File at Root"
            onClick={(e): void => {
              e.stopPropagation()
              setCreatingType({ parent: rootPath, type: 'file' })
              setExpanded((prev) => ({ ...prev, [rootPath]: true }))
            }}
          >
            <Plus size={13} />
          </button>
          <button
            className="tree-node-action-btn"
            title="New Folder at Root"
            onClick={(e): void => {
              e.stopPropagation()
              setCreatingType({ parent: rootPath, type: 'folder' })
              setExpanded((prev) => ({ ...prev, [rootPath]: true }))
            }}
          >
            <FolderPlus size={13} />
          </button>
        </span>
      </div>

      <div style={{ marginTop: '8px' }}>
        {expanded[rootPath] && (
          <div>
            {creatingType && creatingType.parent === rootPath && (
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
                    setCreatingType(null)
                    setCreatingName('')
                  }}
                />
              </form>
            )}
            {(contents[rootPath] || []).map((node) => renderNode(node, rootPath))}
          </div>
        )}
      </div>
    </div>
  )
}
