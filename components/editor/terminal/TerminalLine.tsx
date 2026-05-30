'use client'

import type { TerminalLineData } from './terminal.types'
import {
  getLinePrefix,
  getLineColor,
  getPrefixColor,
  formatTimestamp,
} from './terminalUtils'

interface TerminalLineProps {
  line: TerminalLineData
  showTimestamp?: boolean
}

export default function TerminalLine({
  line,
  showTimestamp,
}: TerminalLineProps) {
  const prefix = getLinePrefix(line.type)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '1px 0',
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: '1.6',
        wordBreak: 'break-all',
      }}
    >
      {showTimestamp && (
        <span
          style={{
            color: '#4a4a4a',
            fontSize: '11px',
            flexShrink: 0,
            paddingTop: '2px',
            minWidth: '60px',
          }}
        >
          {formatTimestamp(line.timestamp)}
        </span>
      )}

      {prefix !== '' && (
        <span
          style={{
            color: getPrefixColor(line.type),
            flexShrink: 0,
            fontWeight: 500,
            minWidth: '12px',
          }}
        >
          {prefix}
        </span>
      )}

      <span
        style={{
          color: getLineColor(line.type),
          flex: 1,
          whiteSpace: 'pre-wrap',
        }}
      >
        {line.text}
      </span>
    </div>
  )
}
