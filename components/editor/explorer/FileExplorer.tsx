'use client'

import { Tree } from 'react-arborist'
import type { NodeApi } from 'react-arborist'
import { useState, useEffect, useRef } from 'react'
import { INITIAL_FILE_TREE } from './explorer.data'
import type { FileNode } from './explorer.types'
import FileTreeNode from './FileTreeNode'

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 240,
    height: 500,
  })
  const treeContainerRef = useRef<HTMLDivElement>(null)

  // Measure the tree container so react-arborist gets a numeric height/width.
  useEffect(() => {
    const el = treeContainerRef.current
    if (!el) return
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
      <div
        style={{
          height: 35,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          background: '#1e1e1e',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#bbbbbb',
          }}
        >
          EXPLORER
        </span>
      </div>

      <div
        ref={treeContainerRef}
        className="file-explorer-scroll"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <Tree<FileNode>
          data={INITIAL_FILE_TREE}
          onSelect={handleSelect}
          openByDefault={false}
          width={size.width}
          height={size.height}
          indent={16}
          rowHeight={24}
          overscanCount={4}
        >
          {(props) => <FileTreeNode {...props} selectedId={selectedId} />}
        </Tree>
      </div>
    </div>
  )
}
