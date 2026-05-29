'use client'

import { useState } from 'react'
import type { NodeRendererProps } from 'react-arborist'
import { ChevronRight } from 'lucide-react'
import type { FileNode } from './explorer.types'
import FileIcon from './FileTreeIcons'

type FileTreeNodeProps = NodeRendererProps<FileNode> & {
  selectedId: string | null
}

export default function FileTreeNode({
  node,
  style,
  dragHandle,
  selectedId,
}: FileTreeNodeProps) {
  const [hovered, setHovered] = useState(false)

  const isFolder = node.data.type === 'folder'
  const isActive = node.data.id === selectedId

  let background = 'transparent'
  if (isActive) background = '#094771'
  else if (node.isSelected) background = '#37373d'
  else if (hovered) background = '#2a2d2e'

  return (
    <div
      ref={dragHandle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (isFolder) {
          node.toggle()
        } else {
          node.handleClick(e)
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
