'use client'

import type { ClassificationResult, DetectionTier } from '@/lib/classifier/types'

interface AlgorithmBadgeProps {
  classification: ClassificationResult | null
  isClassifying: boolean
}

function tierInfo(tier: DetectionTier): { label: string; bg: string; fg: string } {
  switch (tier) {
    case 1:
      return { label: 'Pattern match', bg: '#0f3a33', fg: '#4ecdc4' }
    case 2:
      return { label: 'Name detected', bg: '#102a44', fg: '#75beff' }
    case 3:
      return { label: 'AI identified', bg: '#2a1a3a', fg: '#c084fc' }
    default:
      return { label: 'Generic', bg: '#2a2a2a', fg: '#8a8a8a' }
  }
}

function barColor(confidence: number): string {
  if (confidence >= 0.75) return '#22c55e'
  if (confidence >= 0.5) return '#cca700'
  return '#f48771'
}

export default function AlgorithmBadge({
  classification,
  isClassifying,
}: AlgorithmBadgeProps) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid #1c1c1f',
        flexShrink: 0,
      }}
    >
      {isClassifying ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              border: '2px solid #333',
              borderTopColor: '#007acc',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, color: '#a1a1aa' }}>
            Classifying algorithm…
          </span>
        </div>
      ) : classification ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>
              {classification.label}
            </span>
            {(() => {
              const t = tierInfo(classification.tier)
              return (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: t.bg,
                    color: t.fg,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </span>
              )
            })()}
          </div>

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 4,
                width: '100%',
                background: '#1c1c1f',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(classification.confidence * 100)}%`,
                  background: barColor(classification.confidence),
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: '#52525b' }}>
              {Math.round(classification.confidence * 100)}% confidence ·{' '}
              {classification.dataStructure}
            </div>
          </div>
        </>
      ) : (
        <span style={{ fontSize: 13, color: '#3c3c3c' }}>
          No algorithm classified yet
        </span>
      )}
    </div>
  )
}
