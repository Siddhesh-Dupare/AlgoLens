'use client'

import { useState } from 'react'

interface TerminalResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void
}

export default function TerminalResizeHandle({
  onResizeStart,
}: TerminalResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseDown={onResizeStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Resize terminal"
      style={{
        width: '100%',
        height: '4px',
        cursor: 'row-resize',
        flexShrink: 0,
        background: 'transparent',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: isHovered ? '#007acc' : '#2d2d2d',
          transform: 'translateY(-50%)',
          transition: 'background 150ms',
        }}
      />
    </div>
  )
}
