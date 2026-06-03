'use client'

import { Tree } from 'react-arborist'
import type { NodeApi, TreeApi } from 'react-arborist'
import { useState, useEffect, useRef } from 'react'
import { FolderOpen, ChevronDown, FilePlus, FolderPlus } from 'lucide-react'
import type { FileNode, ContextMenuState } from './explorer.types'
import {
  openFolder,
  createNewFile,
  createNewFolder,
  deleteFileOrFolder,
  renameFile,
  getLanguageFromFilename,
} from './filesystemUtils'
import FileTreeNode from './FileTreeNode'
import FileExplorerContextMenu from './FileExplorerContextMenu'

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void
}

// ---- Immutable tree helpers -------------------------------------------------

function findNodeById(tree: FileNode[], id: string): FileNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function insertChild(
  tree: FileNode[],
  parentId: string | null,
  rootName: string | null,
  newNode: FileNode
): FileNode[] {
  if (parentId === null || parentId === rootName) {
    return [...tree, newNode]
  }
  return tree.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), newNode] }
    }
    if (node.children) {
      return {
        ...node,
        children: insertChild(node.children, parentId, rootName, newNode),
      }
    }
    return node
  })
}

function updateNodeById(
  tree: FileNode[],
  id: string,
  patch: Partial<FileNode>
): FileNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, ...patch }
    if (node.children) {
      return { ...node, children: updateNodeById(node.children, id, patch) }
    }
    return node
  })
}

function removeNodeById(tree: FileNode[], id: string): FileNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeNodeById(node.children, id) }
        : node
    )
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [rootName, setRootName] = useState<string | null>(null)
  const [rootHandle, setRootHandle] =
    useState<FileSystemDirectoryHandle | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [openHovered, setOpenHovered] = useState(false)
  const [newFileHovered, setNewFileHovered] = useState(false)
  const [newFolderHovered, setNewFolderHovered] = useState(false)
  const [emptyBtnHovered, setEmptyBtnHovered] = useState(false)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    node: null,
  })

  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 240,
    height: 500,
  })
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<TreeApi<FileNode> | null>(null)

  useEffect(() => {
    const el = treeContainerRef.current
    if (!el) return
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [fileTree.length, isLoading])

  const handleOpenFolder = async () => {
    setIsLoading(true)
    try {
      const result = await openFolder()
      if (result) {
        setRootName(result.name)
        setRootHandle(result.handle)
        setFileTree(result.children)
        setSelectedId(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (nodes: NodeApi<FileNode>[]) => {
    const node = nodes[0]
    if (node && node.data.type === 'file' && !node.data.isNew) {
      setSelectedId(node.data.id)
      onFileSelect(node.data)
    }
  }

  const getParentDirHandle = (
    parentId?: string | null
  ): FileSystemDirectoryHandle | null => {
    if (!parentId || parentId === rootName) return rootHandle
    return findNodeById(fileTree, parentId)?.dirHandle ?? null
  }

  // react-arborist create: insert a placeholder, then it enters edit mode.
  const handleCreate = ({
    parentId,
    type,
  }: {
    parentId: string | null
    type: 'internal' | 'leaf'
  }) => {
    const tempId = `__new__/${Date.now()}/${Math.random()
      .toString(36)
      .slice(2, 6)}`
    const newNode: FileNode = {
      id: tempId,
      name: '',
      type: type === 'internal' ? 'folder' : 'file',
      parentId: parentId ?? rootName ?? '',
      isNew: true,
      children: type === 'internal' ? [] : undefined,
    }
    setFileTree((prev) => insertChild(prev, parentId, rootName, newNode))
    return { id: tempId }
  }

  // react-arborist rename submit: finalize a new node, or rename an existing one.
  const handleRename = async ({
    id,
    name,
    node,
  }: {
    id: string
    name: string
    node: NodeApi<FileNode>
  }) => {
    const data = node.data
    const base = data.parentId && data.parentId !== '' ? data.parentId : rootName
    const realId = `${base}/${name}`
    const parentDir = getParentDirHandle(data.parentId)

    if (data.isNew) {
      if (!parentDir) {
        setFileTree((prev) => removeNodeById(prev, id))
        return
      }
      if (data.type === 'folder') {
        const dh = await createNewFolder(parentDir, name)
        if (!dh) {
          setFileTree((prev) => removeNodeById(prev, id))
          return
        }
        setFileTree((prev) =>
          updateNodeById(prev, id, {
            id: realId,
            name,
            isNew: false,
            dirHandle: dh,
            children: [],
          })
        )
      } else {
        const fh = await createNewFile(parentDir, name)
        if (!fh) {
          setFileTree((prev) => removeNodeById(prev, id))
          return
        }
        setFileTree((prev) =>
          updateNodeById(prev, id, {
            id: realId,
            name,
            isNew: false,
            handle: fh,
            language: getLanguageFromFilename(name),
          })
        )
      }
      return
    }

    // Rename existing node.
    if (data.type === 'folder') {
      window.alert('Folder rename is not supported yet.')
      return
    }
    if (!parentDir) return
    const ok = await renameFile(parentDir, data.name, name)
    if (!ok) return
    const newHandle = await parentDir
      .getFileHandle(name)
      .catch(() => undefined)
    setFileTree((prev) =>
      updateNodeById(prev, id, {
        id: realId,
        name,
        handle: newHandle ?? data.handle,
        language: getLanguageFromFilename(name),
      })
    )
  }

  // react-arborist delete: remove from disk + state, and close any open tabs.
  const handleTreeDelete = async ({ nodes }: { nodes: NodeApi<FileNode>[] }) => {
    for (const node of nodes) {
      const data = node.data
      const parentDir = getParentDirHandle(data.parentId)
      if (parentDir) {
        await deleteFileOrFolder(parentDir, data.name, data.type === 'folder')
      }
      window.dispatchEvent(
        new CustomEvent('algolens:file-deleted', { detail: { id: data.id } })
      )
      setFileTree((prev) => removeNodeById(prev, data.id))
    }
  }

  const handleCancelNew = (id: string) => {
    setFileTree((prev) => removeNodeById(prev, id))
  }

  // ---- Context menu ---------------------------------------------------------

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, node })
  }

  const closeContextMenu = () =>
    setContextMenu({ isOpen: false, x: 0, y: 0, node: null })

  const handleContextDelete = (node: FileNode) => {
    const confirmed = window.confirm(
      `Delete ${node.name}? This cannot be undone.`
    )
    if (confirmed) treeRef.current?.delete(node.id)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 35,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 0 12px',
          background: '#1e1e1e',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#bbbbbb',
            flex: 1,
          }}
        >
          EXPLORER
        </span>

        <button
          type="button"
          aria-label="New File"
          title="New File"
          onClick={() => treeRef.current?.create({ type: 'leaf', parentId: null })}
          onMouseEnter={() => setNewFileHovered(true)}
          onMouseLeave={() => setNewFileHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: newFileHovered ? '#2a2d2e' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 3,
            color: newFileHovered ? '#cccccc' : '#8a8a8a',
          }}
        >
          <FilePlus size={14} />
        </button>

        <button
          type="button"
          aria-label="New Folder"
          title="New Folder"
          onClick={() =>
            treeRef.current?.create({ type: 'internal', parentId: null })
          }
          onMouseEnter={() => setNewFolderHovered(true)}
          onMouseLeave={() => setNewFolderHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: newFolderHovered ? '#2a2d2e' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 3,
            color: newFolderHovered ? '#cccccc' : '#8a8a8a',
          }}
        >
          <FolderPlus size={14} />
        </button>

        <button
          type="button"
          aria-label="Open folder"
          title="Open Folder"
          onClick={handleOpenFolder}
          onMouseEnter={() => setOpenHovered(true)}
          onMouseLeave={() => setOpenHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: openHovered ? '#2a2d2e' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 3,
            color: openHovered ? '#cccccc' : '#8a8a8a',
          }}
        >
          <FolderOpen size={15} />
        </button>
      </div>

      {/* Body */}
      <div
        ref={treeContainerRef}
        className="file-explorer-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 80,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: '2px solid #333',
                borderTopColor: '#007acc',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : rootName === null ? (
          <div style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 12, color: '#6a6a6a', marginBottom: 8 }}>
              No folder open
            </div>
            <button
              type="button"
              onClick={handleOpenFolder}
              onMouseEnter={() => setEmptyBtnHovered(true)}
              onMouseLeave={() => setEmptyBtnHovered(false)}
              style={{
                fontSize: 12,
                color: '#cccccc',
                background: emptyBtnHovered ? '#2a2d2e' : 'transparent',
                border: '1px solid #3c3c3c',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Open Folder
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 24,
                padding: '0 8px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <ChevronDown size={14} color="#8a8a8a" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#bbbbbb',
                  textTransform: 'uppercase',
                  marginLeft: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rootName}
              </span>
            </div>

            {fileTree.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: '#5a5a5a',
                  padding: '4px 8px 4px 24px',
                  flexShrink: 0,
                }}
              >
                Empty folder — use the + buttons to add files.
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0 }}>
              <Tree<FileNode>
                ref={treeRef}
                data={fileTree}
                onSelect={handleSelect}
                onCreate={handleCreate}
                onRename={handleRename}
                onDelete={handleTreeDelete}
                disableDrag
                openByDefault={false}
                width={size.width}
                height={Math.max(size.height - 24, 0)}
                indent={16}
                rowHeight={24}
                overscanCount={4}
              >
                {(props) => (
                  <FileTreeNode
                    {...props}
                    selectedId={selectedId}
                    onContextMenu={handleContextMenu}
                    onCancelNew={handleCancelNew}
                  />
                )}
              </Tree>
            </div>
          </>
        )}
      </div>

      {contextMenu.isOpen && contextMenu.node && (
        <FileExplorerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={closeContextMenu}
          onNewFile={(parentId) =>
            treeRef.current?.create({ type: 'leaf', parentId })
          }
          onNewFolder={(parentId) =>
            treeRef.current?.create({ type: 'internal', parentId })
          }
          onRename={(node) => treeRef.current?.edit(node.id)}
          onDelete={handleContextDelete}
          onCopyPath={(node) => navigator.clipboard.writeText(node.id)}
        />
      )}
    </div>
  )
}
