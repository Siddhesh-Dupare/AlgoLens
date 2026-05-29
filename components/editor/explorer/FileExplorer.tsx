'use client'

import { Tree } from 'react-arborist'
import type { NodeApi } from 'react-arborist'
import { useState, useEffect, useRef } from 'react'
import { FolderOpen, ChevronDown } from 'lucide-react'
import type { FileNode } from './explorer.types'
import { openFolder } from './filesystemUtils'
import FileTreeNode from './FileTreeNode'

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [rootName, setRootName] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [openHovered, setOpenHovered] = useState(false)
  const [emptyBtnHovered, setEmptyBtnHovered] = useState(false)

  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 240,
    height: 500,
  })
  const treeContainerRef = useRef<HTMLDivElement>(null)

  // Measure the tree container so react-arborist gets numeric width/height.
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
        setFileTree(result.children)
        setSelectedId(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (nodes: NodeApi<FileNode>[]) => {
    const node = nodes[0]
    if (node && node.data.type === 'file') {
      setSelectedId(node.data.id)
      onFileSelect(node.data)
    }
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
          gap: 4,
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
          aria-label="Open folder"
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
        ) : fileTree.length === 0 ? (
          <div style={{ padding: '20px 16px' }}>
            {rootName === null ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: '#6a6a6a',
                    marginBottom: 8,
                  }}
                >
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
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#6a6a6a' }}>
                {rootName} is empty
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Root folder header row */}
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

            {/* File tree */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <Tree<FileNode>
                data={fileTree}
                onSelect={handleSelect}
                openByDefault={false}
                width={size.width}
                height={Math.max(size.height - 24, 0)}
                indent={16}
                rowHeight={24}
                overscanCount={4}
              >
                {(props) => <FileTreeNode {...props} selectedId={selectedId} />}
              </Tree>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
