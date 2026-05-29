'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface StatusBarToggleProps {
  label: string
  icon: ReactNode
  isActive: boolean
  onClick: () => void
  tooltip: string
  shortcut?: string
}

export default function StatusBarToggle({
  label,
  icon,
  isActive,
  onClick,
  tooltip,
  shortcut,
}: StatusBarToggleProps) {
  const [hovered, setHovered] = useState(false)

  let background = 'transparent'
  let color = '#6a6a6a'
  if (isActive) {
    background = '#37373d'
    color = '#cccccc'
  } else if (hovered) {
    background = '#2a2d2e'
    color = '#cccccc'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${tooltip}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={tooltip}
      aria-pressed={isActive}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '0 10px',
        height: '100%',
        background,
        color,
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        borderRadius: '3px',
        transition: 'background 150ms, color 150ms',
        outline: 'none',
        position: 'relative',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>

      <span>{label}</span>

      {isActive && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10%',
            right: '10%',
            height: '2px',
            background: '#007acc',
            borderRadius: '2px 2px 0 0',
          }}
        />
      )}
    </button>
  )
}
