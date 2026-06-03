'use client'

import { useState } from 'react'
import { Clock, Trash2, Maximize2, Minimize2, X } from 'lucide-react'

interface TerminalToolbarProps {
  onClose: () => void
  onClear: () => void
  onToggleTimestamps: () => void
  showTimestamps: boolean
  onMaximize: () => void
  isMaximized: boolean
}

interface IconButtonProps {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}

function IconButton({ label, onClick, active, children }: IconButtonProps) {
  const [hovered, setHovered] = useState(false)
  let background = 'transparent'
  if (active) background = '#37373d'
  else if (hovered) background = '#2a2d2e'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? '#cccccc' : hovered ? '#cccccc' : '#6a6a6a',
        background,
        border: 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: '3px',
      }}
    >
      {children}
    </button>
  )
}

export default function TerminalToolbar({
  onClose,
  onClear,
  onToggleTimestamps,
  showTimestamps,
  onMaximize,
  isMaximized,
}: TerminalToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '35px',
        background: '#252526',
        borderTop: '1px solid #2d2d2d',
        padding: '0 8px 0 12px',
        flexShrink: 0,
        gap: '4px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: '#cccccc',
          background: 'transparent',
          borderBottom: '1px solid #cccccc',
          padding: '0 0 2px 0',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        TERMINAL
      </span>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <IconButton
          label="Toggle timestamps"
          onClick={onToggleTimestamps}
          active={showTimestamps}
        >
          <Clock size={14} />
        </IconButton>

        <IconButton label="Clear terminal" onClick={onClear}>
          <Trash2 size={14} />
        </IconButton>

        <IconButton
          label={isMaximized ? 'Restore terminal' : 'Maximize terminal'}
          onClick={onMaximize}
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </IconButton>

        <IconButton label="Close terminal" onClick={onClose}>
          <X size={14} />
        </IconButton>
      </div>
    </div>
  )
}
