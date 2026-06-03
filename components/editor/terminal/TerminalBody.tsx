'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [terminalFontSize, setTerminalFontSize] = useState(13)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines.length])

  // Terminal font tracks the global zoom level.
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent).detail.direction as string
      setTerminalFontSize((prev) => {
        if (dir === 'in') return Math.min(prev + 1, 24)
        if (dir === 'out') return Math.max(prev - 1, 10)
        if (dir === 'reset') return 13
        return prev
      })
    }
    window.addEventListener('algolens:zoom', handler)
    return () => window.removeEventListener('algolens:zoom', handler)
  }, [])

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
        fontSize: terminalFontSize,
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
