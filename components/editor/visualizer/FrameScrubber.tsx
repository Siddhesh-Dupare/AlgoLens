'use client'

interface FrameScrubberProps {
  totalFrames: number
  currentFrame: number
  onChange: (index: number) => void
}

export default function FrameScrubber({
  totalFrames,
  currentFrame,
  onChange,
}: FrameScrubberProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderTop: '1px solid #1c1c1f',
        flexShrink: 0,
      }}
    >
      <input
        type="range"
        min={0}
        max={Math.max(0, totalFrames - 1)}
        value={currentFrame}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Scrub frames"
        style={{ flex: 1, accentColor: '#007acc', cursor: 'pointer' }}
      />
      <span
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#a1a1aa',
          whiteSpace: 'nowrap',
          minWidth: 64,
          textAlign: 'right',
        }}
      >
        Frame {totalFrames === 0 ? 0 : currentFrame + 1} / {totalFrames}
      </span>
    </div>
  )
}
