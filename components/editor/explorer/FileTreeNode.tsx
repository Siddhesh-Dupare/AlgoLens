'use client'

import { useState } from 'react'
import type { NodeRendererProps } from 'react-arborist'
import { ChevronRight } from 'lucide-react'
import type { FileNode } from './explorer.types'
import FileIcon from './FileTreeIcons'
import FileExplorerNewInput from './FileExplorerNewInput'

type FileTreeNodeProps = NodeRendererProps<FileNode> & {
  selectedId: string | null
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
  onCancelNew: (id: string) => void
}

export default function FileTreeNode({
  node,
  style,
  dragHandle,
  selectedId,
  onContextMenu,
  onCancelNew,
}: FileTreeNodeProps) {
  const [hovered, setHovered] = useState(false)

  const isFolder = node.data.type === 'folder'
  const isActive = node.data.id === selectedId

  // Inline editing (rename or freshly created node) — react-arborist manages
  // the editing state; we just render an input bound to submit/reset.
  if (node.isEditing) {
    return (
      <div ref={dragHandle} style={{ ...style }}>
        <FileExplorerNewInput
          depth={0}
          type={isFolder ? 'folder' : 'file'}
          initialValue={node.data.isNew ? '' : node.data.name}
          onConfirm={(name) => node.submit(name)}
          onCancel={() => {
            const wasNew = node.data.isNew
            const nodeId = node.data.id
            node.reset()
            if (wasNew) onCancelNew(nodeId)
          }}
        />
      </div>
    )
  }

  let background = 'transparent'
  if (isActive) background = '#094771'
  else if (node.isSelected) background = '#37373d'
  else if (hovered) background = '#2a2d2e'

  return (
    <div
      ref={dragHandle}
      className="explorer-row-focus"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => onContextMenu(e, node.data)}
      onClick={(e) => {
        if (isFolder) node.toggle()
        else node.handleClick(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (isFolder) node.toggle()
          else node.select()
        } else if (e.key === 'ArrowRight') {
          if (isFolder && !node.isOpen) node.toggle()
        } else if (e.key === 'ArrowLeft') {
          if (isFolder && node.isOpen) node.toggle()
        }
      }}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        height: 24,
        paddingRight: 8,
        gap: 4,
        cursor: 'pointer',
        borderRadius: 3,
        background,
        color: isActive ? '#ffffff' : '#cccccc',
        boxSizing: 'border-box',
      }}
    >
      {isFolder ? (
        <ChevronRight
          size={14}
          color="#8a8a8a"
          style={{
            transform: node.isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        />
      ) : (
        <span style={{ width: 14, flexShrink: 0 }} />
      )}

      <FileIcon
        name={node.data.name}
        language={node.data.language}
        isFolder={isFolder}
        isOpen={node.isOpen}
      />

      <span
        style={{
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          lineHeight: '24px',
        }}
      >
        {node.data.name}
      </span>
    </div>
  )
}
