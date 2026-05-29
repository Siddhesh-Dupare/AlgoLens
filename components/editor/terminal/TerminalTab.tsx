'use client'

import { useState } from 'react'
import { Terminal as TerminalIcon, Braces, X } from 'lucide-react'
import type { TerminalInstance } from './terminal.types'

interface TerminalTabProps {
  instance: TerminalInstance
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
}

export default function TerminalTab({
  instance,
  isActive,
  onClick,
  onClose,
}: TerminalTabProps) {
  const [hovered, setHovered] = useState(false)
  const [closeHovered, setCloseHovered] = useState(false)

  const Icon =
    instance.shellType === 'python' || instance.shellType === 'node'
      ? Braces
      : TerminalIcon

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '35px',
        padding: '0 10px',
        cursor: 'pointer',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        background: isActive ? '#1e1e1e' : 'transparent',
        color: isActive ? '#cccccc' : '#8a8a8a',
        borderRight: '1px solid #2d2d2d',
        fontSize: '12px',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <Icon size={13} color="currentColor" style={{ flexShrink: 0 }} />

      <span>{instance.title}</span>

      <button
        type="button"
        aria-label={`Close ${instance.title}`}
        onClick={(e) => {
          e.stopPropagation()
          onClose(e)
        }}
        onMouseEnter={() => setCloseHovered(true)}
        onMouseLeave={() => setCloseHovered(false)}
        style={{
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '3px',
          background: closeHovered ? '#5a5a5a' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: closeHovered ? '#ffffff' : '#8a8a8a',
          opacity: hovered ? 1 : 0,
          padding: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
