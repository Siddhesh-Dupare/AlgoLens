'use client'

import { useEffect, useRef } from 'react'
import TerminalLine from './TerminalLine'
import type { TerminalLineData } from './terminal.types'

interface TerminalBodyProps {
  lines: TerminalLineData[]
  showTimestamps?: boolean
}

export default function TerminalBody({
  lines,
  showTimestamps = false,
}: TerminalBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines.length])

  return (
    <div
      ref={containerRef}
      className="file-explorer-scroll"
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        minHeight: 0,
      }}
    >
      {lines.length === 0 ? (
        <div
          style={{
            color: '#3c3c3c',
            fontSize: '12px',
            fontFamily: 'monospace',
            padding: '4px 0',
          }}
        >
          Terminal ready.
        </div>
      ) : (
        lines.map((line) => (
          <TerminalLine
            key={line.id}
            line={line}
            showTimestamp={showTimestamps}
          />
        ))
      )}
    </div>
  )
}
