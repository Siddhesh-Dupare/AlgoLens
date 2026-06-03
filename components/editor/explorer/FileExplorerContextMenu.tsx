'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  Copy,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { FileNode } from './explorer.types'

interface FileExplorerContextMenuProps {
  x: number
  y: number
  node: FileNode
  onClose: () => void
  onNewFile: (parentId: string) => void
  onNewFolder: (parentId: string) => void
  onRename: (node: FileNode) => void
  onDelete: (node: FileNode) => void
  onCopyPath: (node: FileNode) => void
}

const MENU_WIDTH = 220
const MENU_HEIGHT = 260

interface RowProps {
  icon: ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}

function Row({ icon, label, danger, onClick }: RowProps) {
  const [hovered, setHovered] = useState(false)
  let background = 'transparent'
  let color = '#cccccc'
  if (hovered) {
    background = danger ? '#5a1d1d' : '#094771'
    color = danger ? '#f48771' : '#ffffff'
  }
  return (
    <div
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px',
        fontSize: 12,
        color,
        cursor: 'pointer',
        borderRadius: 3,
        margin: '0 4px',
        background,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </div>
  )
}

function Separator() {
  return <div style={{ height: 1, background: '#3c3c3c', margin: '4px 0' }} />
}

export default function FileExplorerContextMenu({
  x,
  y,
  node,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
}: FileExplorerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const clampedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8)
  const clampedY = Math.min(y, window.innerHeight - MENU_HEIGHT - 8)

  const copyRelativePath = () => {
    const parts = node.id.split('/')
    navigator.clipboard.writeText(parts.slice(1).join('/'))
    onClose()
  }

  const isFolder = node.type === 'folder'

  return (
    <div
      ref={menuRef}
      role="menu"
      className="context-menu-enter"
      style={{
        position: 'fixed',
        top: Math.max(8, clampedY),
        left: Math.max(8, clampedX),
        minWidth: MENU_WIDTH,
        background: '#252526',
        border: '1px solid #3c3c3c',
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {isFolder && (
        <>
          <Row
            icon={<FilePlus size={14} />}
            label="New File"
            onClick={() => {
              onNewFile(node.id)
              onClose()
            }}
          />
          <Row
            icon={<FolderPlus size={14} />}
            label="New Folder"
            onClick={() => {
              onNewFolder(node.id)
              onClose()
            }}
          />
          <Separator />
        </>
      )}

      <Row
        icon={<Pencil size={14} />}
        label="Rename"
        onClick={() => {
          onRename(node)
          onClose()
        }}
      />
      <Row
        icon={<Trash2 size={14} />}
        label="Delete"
        danger
        onClick={() => {
          onDelete(node)
          onClose()
        }}
      />

      <Separator />

      <Row
        icon={<Copy size={14} />}
        label="Copy Path"
        onClick={() => {
          onCopyPath(node)
          onClose()
        }}
      />
      <Row
        icon={<Copy size={14} />}
        label="Copy Relative Path"
        onClick={copyRelativePath}
      />
    </div>
  )
}
