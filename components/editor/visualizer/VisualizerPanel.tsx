'use client'

import { useClassifierStore } from '@/store/useClassifierStore'
import AlgorithmBadge from './AlgorithmBadge'
import IRPreview from './IRPreview'
import FrameScrubber from './FrameScrubber'

export default function VisualizerPanel() {
  const output = useClassifierStore((s) => s.output)
  const isClassifying = useClassifierStore((s) => s.isClassifying)
  const currentIRFrame = useClassifierStore((s) => s.currentIRFrame)
  const irFrameIndex = useClassifierStore((s) => s.irFrameIndex)
  const setIRFrameIndex = useClassifierStore((s) => s.setIRFrameIndex)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0a0c',
      }}
    >
      <AlgorithmBadge
        classification={output?.classification ?? null}
        isClassifying={isClassifying}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <IRPreview
          frame={currentIRFrame}
          algorithmClass={output?.classification.algorithmClass ?? null}
        />
      </div>

      {output && output.frames.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <FrameScrubber
            totalFrames={output.frames.length}
            currentFrame={irFrameIndex}
            onChange={(i) => setIRFrameIndex(i)}
          />
          <div
            style={{
              fontSize: 12,
              color: '#a1a1aa',
              padding: '8px 12px',
              borderTop: '1px solid #1c1c1f',
              minHeight: 36,
            }}
          >
            {currentIRFrame?.narration ?? ''}
          </div>
        </div>
      )}
    </div>
  )
}
