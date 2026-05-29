'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import TerminalTab from './TerminalTab'
import type { TerminalInstance } from './terminal.types'

interface TerminalTabsProps {
  instances: TerminalInstance[]
  activeInstanceId: string | null
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
  onNewTerminal: () => void
}

export default function TerminalTabs({
  instances,
  activeInstanceId,
  onTabClick,
  onTabClose,
  onNewTerminal,
}: TerminalTabsProps) {
  const [plusHovered, setPlusHovered] = useState(false)

  return (
    <div
      style={{
        height: '35px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        background: '#252526',
        borderBottom: '1px solid #2d2d2d',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div
        className="tabs-no-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {instances.map((instance) => (
          <TerminalTab
            key={instance.id}
            instance={instance}
            isActive={instance.id === activeInstanceId}
            onClick={() => onTabClick(instance.id)}
            onClose={() => onTabClose(instance.id)}
          />
        ))}
      </div>

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          borderLeft: '1px solid #2d2d2d',
          height: '100%',
          gap: '2px',
        }}
      >
        <button
          type="button"
          aria-label="New terminal"
          onClick={onNewTerminal}
          onMouseEnter={() => setPlusHovered(true)}
          onMouseLeave={() => setPlusHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: plusHovered ? '#cccccc' : '#8a8a8a',
            background: plusHovered ? '#2a2d2e' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '3px',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
