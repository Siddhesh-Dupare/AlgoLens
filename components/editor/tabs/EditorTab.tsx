'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { TabItem } from './tabs.types'

interface EditorTabProps {
  tab: TabItem
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
}

const DOT_COLORS: Record<string, string> = {
  python: '#3b8eea',
  javascript: '#f1c40f',
  typescript: '#3b8eea',
  cpp: '#9b59b6',
  c: '#8e44ad',
  java: '#e74c3c',
  markdown: '#4ecdc4',
  json: '#f39c12',
  html: '#e67e22',
  css: '#2980b9',
}

export default function EditorTab({
  tab,
  isActive,
  onClick,
  onClose,
}: EditorTabProps) {
  const [tabHovered, setTabHovered] = useState(false)
  const [closeHovered, setCloseHovered] = useState(false)

  const dotColor = DOT_COLORS[tab.language] ?? '#7f8c8d'

  let background = '#2d2d2d'
  let color = '#8a8a8a'
  if (isActive) {
    background = '#1e1e1e'
    color = '#ffffff'
  } else if (tabHovered) {
    background = '#2a2a2a'
    color = '#cccccc'
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setTabHovered(true)}
      onMouseLeave={() => setTabHovered(false)}
      title={tab.name}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 35,
        padding: '0 12px 0 14px',
        cursor: 'pointer',
        flexShrink: 0,
        position: 'relative',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        minWidth: 80,
        maxWidth: 200,
        background,
        color,
        borderRight: '1px solid #252526',
        borderTop: isActive ? '1px solid #007acc' : '1px solid transparent',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          background: dotColor,
        }}
      />

      <span
        style={{
          fontSize: 13,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {tab.name}
      </span>

      {tab.isDirty ? (
        <span
          style={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#ffffff',
          }}
        >
          ●
        </span>
      ) : (
        <button
          type="button"
          aria-label={`Close ${tab.name}`}
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 3,
            border: 'none',
            background: closeHovered ? '#5a5a5a' : 'transparent',
            cursor: 'pointer',
            color: closeHovered ? '#ffffff' : '#8a8a8a',
            opacity: tabHovered ? 1 : 0,
            padding: 0,
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
