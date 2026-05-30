'use client'

import { useEffect, useRef } from 'react'
import type {
  VisualIRFrame,
  AlgorithmClass,
  ArrayVisualIR,
  GraphVisualIR,
  GenericVisualIR,
  CellState,
} from '@/lib/classifier/types'

interface IRPreviewProps {
  frame: VisualIRFrame | null
  algorithmClass: AlgorithmClass | null
}

const CELL_BG: Record<CellState, string> = {
  default: '#1c1c1f',
  current: '#1a2744',
  visited: '#052e16',
  sorted: '#064e26',
  swap: '#3b1a0f',
  found: '#065f2e',
  pivot: '#3b1a0f',
  comparing: '#1e3a5f',
}

function pointerColor(label: string): string {
  if (label === 'low' || label === 'high') return '#75beff'
  if (label === 'mid') return '#86efac'
  return '#f59e0b'
}

function ArrayCanvas({ frame }: { frame: ArrayVisualIR }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cells = frame.cells
    const n = Math.max(cells.length, 1)
    const containerW = 410
    const cellW = Math.min(56, Math.floor((containerW - 20) / n))
    const cellH = 52
    const top = frame.key ? 64 : 12
    const width = Math.max(containerW, n * (cellW + 4) + 20)
    const height = top + cellH + 40

    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    // Key badge
    if (frame.key) {
      const eq = frame.key.result === 'equal'
      const cx = 30
      ctx.beginPath()
      ctx.arc(cx, 28, 16, 0, 2 * Math.PI)
      ctx.fillStyle = '#18181b'
      ctx.fill()
      ctx.strokeStyle = eq ? '#22c55e' : '#f48771'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(frame.key.value), cx, 28)
      ctx.fillStyle = '#71717a'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Key: ${frame.key.value}`, cx + 24, 22)
      if (frame.key.result) {
        ctx.fillStyle = eq ? '#22c55e' : '#f48771'
        ctx.fillText(eq ? 'Equal' : 'Not Equal', cx + 24, 36)
      }
    }

    cells.forEach((cell, i) => {
      const x = 10 + i * (cellW + 4)
      ctx.fillStyle = CELL_BG[cell.state] ?? '#1c1c1f'
      ctx.strokeStyle = cell.state === 'current' ? '#3b82f6' : '#3c3c3c'
      ctx.lineWidth = cell.state === 'current' ? 2 : 1
      // rounded rect
      const r = 6
      ctx.beginPath()
      ctx.moveTo(x + r, top)
      ctx.arcTo(x + cellW, top, x + cellW, top + cellH, r)
      ctx.arcTo(x + cellW, top + cellH, x, top + cellH, r)
      ctx.arcTo(x, top + cellH, x, top, r)
      ctx.arcTo(x, top, x + cellW, top, r)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 15px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(cell.value), x + cellW / 2, top + cellH / 2)

      ctx.fillStyle = '#52525b'
      ctx.font = '10px sans-serif'
      ctx.fillText(String(i), x + cellW / 2, top + cellH + 10)

      // pointer labels under this index
      const ptrs = frame.pointers.filter((p) => p.index === i)
      ptrs.forEach((p, k) => {
        ctx.fillStyle = pointerColor(p.label)
        ctx.font = 'bold 11px monospace'
        ctx.fillText(p.label, x + cellW / 2, top + cellH + 24 + k * 12)
      })
    })
  }, [frame])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', maxWidth: '100%' }}
    />
  )
}

function GraphSVG({ frame }: { frame: GraphVisualIR }) {
  const colorFor = (state: string): string => {
    switch (state) {
      case 'current':
        return '#3b82f6'
      case 'visited':
        return '#22c55e'
      case 'queued':
        return '#cca700'
      case 'visiting':
        return '#60a5fa'
      case 'found':
        return '#22c55e'
      default:
        return '#3c3c3c'
    }
  }
  const pos: Record<string, { x: number; y: number }> = {}
  frame.nodes.forEach((n) => {
    pos[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }
  })

  return (
    <svg viewBox="0 0 600 400" style={{ width: '100%', height: 'auto' }}>
      {frame.edges.map((e, i) => {
        const a = pos[e.source]
        const b = pos[e.target]
        if (!a || !b) return null
        return (
          <line
            key={`e${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={e.state === 'traversed' ? '#22c55e' : '#3c3c3c'}
            strokeWidth={e.state === 'traversed' ? 2.5 : 1.5}
          />
        )
      })}
      {frame.nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x ?? 0}
            cy={n.y ?? 0}
            r={20}
            fill="#18181b"
            stroke={colorFor(n.state)}
            strokeWidth={2.5}
          />
          <text
            x={n.x ?? 0}
            y={(n.y ?? 0) + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#e2e8f0"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function GenericGrid({ frame }: { frame: GenericVisualIR }) {
  const entries = Object.entries(frame.variables)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entries.length === 0 ? (
        <span style={{ fontSize: 12, color: '#52525b' }}>No variables.</span>
      ) : (
        entries.map(([name, value]) => {
          const highlighted = frame.highlightedVars.includes(name)
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '5px 8px',
                borderRadius: 4,
                background: highlighted ? '#3b2a0f' : '#161619',
                border: `1px solid ${highlighted ? '#f59e0b' : '#27272a'}`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: highlighted ? '#fcd34d' : '#a1a1aa',
                  fontFamily: 'monospace',
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 240,
                }}
              >
                {value}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

export default function IRPreview({ frame }: IRPreviewProps) {
  if (!frame) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3c3c3c',
          fontSize: 13,
        }}
      >
        Run debug to see visualization
      </div>
    )
  }

  return (
    <div style={{ padding: 14, height: '100%', overflow: 'auto' }}>
      {frame.dataStructure === 'array' ? (
        <ArrayCanvas frame={frame} />
      ) : frame.dataStructure === 'graph' ? (
        <GraphSVG frame={frame} />
      ) : frame.dataStructure === 'generic' ? (
        <GenericGrid frame={frame} />
      ) : (
        <div style={{ fontSize: 12, color: '#71717a' }}>
          <div style={{ marginBottom: 8, color: '#a1a1aa' }}>
            {frame.dataStructure} preview (renderer arrives in Phase 5)
          </div>
          <pre
            style={{
              fontSize: 11,
              color: '#52525b',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(frame, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
