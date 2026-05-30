'use client'

import type { ToolbarMode } from './toolbar.types'

interface ToolbarStepCounterProps {
  currentFrame: number
  totalFrames: number
  mode: ToolbarMode
}

export default function ToolbarStepCounter({
  currentFrame,
  totalFrames,
  mode,
}: ToolbarStepCounterProps) {
  if (mode === 'idle' && totalFrames === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '0 8px',
        minWidth: '64px',
      }}
    >
      <div
        id="step-counter"
        style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: totalFrames === 0 ? '#3c3c3c' : '#a1a1aa',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        {totalFrames === 0 ? '— / —' : `${currentFrame} / ${totalFrames}`}
      </div>

      {totalFrames > 0 && (
        <div
          style={{
            width: '100%',
            height: '2px',
            background: '#2d2d2d',
            borderRadius: '1px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(currentFrame / totalFrames) * 100}%`,
              background: '#007acc',
              borderRadius: '1px',
              transition: 'width 150ms ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
