'use client'

import { useEffect, useRef, useState } from 'react'
import { executionClient } from '@/lib/executionClient'
import { chatAI } from '@/lib/ai/client'
import type { ComplexityMeasurement } from '@/lib/executionTypes'
import type { ClassificationResult } from '@/lib/classifier/types'

interface ComplexityChartProps {
  sourceCode: string
  language: string
  classification: ClassificationResult | null
  hasKey: boolean
}

interface Analysis {
  observed: string
  optimal: string
  explanation: string
}

// Modest sizes: a quadratic algorithm traces a frame per line event, and the
// debug runner has a 10s ceiling per run, so these keep even O(n²) tractable
// while still revealing the growth curve. The runner stops early if a size
// doesn't complete, so the plotted points are always fully-traced runs.
const INPUT_SIZES = [10, 25, 50, 75, 100]

const REFERENCE_CURVES: Array<{
  label: string
  color: string
  fn: (n: number) => number
}> = [
  { label: 'O(n)', color: '#4ade80', fn: (n) => n },
  { label: 'O(n log n)', color: '#facc15', fn: (n) => n * Math.log2(Math.max(2, n)) },
  { label: 'O(n²)', color: '#f87171', fn: (n) => n * n },
]

// Candidate growth functions for the local curve fit (no AI needed).
const COMPLEXITY_CANDIDATES: Array<{ label: string; f: (n: number) => number }> = [
  { label: 'O(1)', f: () => 1 },
  { label: 'O(log n)', f: (n) => Math.log2(Math.max(2, n)) },
  { label: 'O(n)', f: (n) => n },
  { label: 'O(n log n)', f: (n) => n * Math.log2(Math.max(2, n)) },
  { label: 'O(n²)', f: (n) => n * n },
  { label: 'O(n³)', f: (n) => n * n * n },
]

// Empirically estimate Big-O: for each candidate f(n), the ratio ops/f(n) is
// (nearly) constant when f matches the true growth. The candidate with the
// lowest coefficient of variation across the measured points wins.
function estimateBigO(m: ComplexityMeasurement[]): string {
  if (m.length < 2) return '—'
  let best = '—'
  let bestCV = Infinity
  for (const c of COMPLEXITY_CANDIDATES) {
    const ratios = m.map((d) => d.operations / c.f(d.n))
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length
    if (mean <= 0) continue
    const variance =
      ratios.reduce((a, b) => a + (b - mean) ** 2, 0) / ratios.length
    const cv = Math.sqrt(variance) / mean
    if (cv < bestCV) {
      bestCV = cv
      best = c.label
    }
  }
  return best
}

function drawChart(
  canvas: HTMLCanvasElement,
  measurements: ComplexityMeasurement[]
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || measurements.length === 0) return
  const W = canvas.width
  const H = canvas.height
  ctx.clearRect(0, 0, W, H)

  const pad = { l: 44, r: 10, t: 10, b: 26 }
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const maxN = Math.max(...measurements.map((m) => m.n))
  const maxOps = Math.max(...measurements.map((m) => m.operations), 1)

  const xOf = (n: number) => pad.l + (n / maxN) * plotW
  const yOf = (ops: number) => pad.t + plotH - (ops / maxOps) * plotH

  // Axes
  ctx.strokeStyle = '#2a2a2f'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad.l, pad.t)
  ctx.lineTo(pad.l, pad.t + plotH)
  ctx.lineTo(pad.l + plotW, pad.t + plotH)
  ctx.stroke()

  ctx.fillStyle = '#52525b'
  ctx.font = '9px sans-serif'
  ctx.fillText(String(maxOps), 4, pad.t + 8)
  ctx.fillText('0', pad.l - 10, pad.t + plotH)
  ctx.fillText(`n=${maxN}`, pad.l + plotW - 24, pad.t + plotH + 16)
  ctx.fillText('ops', 4, pad.t + plotH / 2)

  // Reference curves, each normalised so it passes through (maxN, maxOps).
  const step = Math.max(1, Math.floor(maxN / 80))
  for (const ref of REFERENCE_CURVES) {
    const scale = maxOps / ref.fn(maxN)
    ctx.strokeStyle = ref.color
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    let first = true
    for (let n = 1; n <= maxN; n += step) {
      const x = xOf(n)
      const y = yOf(ref.fn(n) * scale)
      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  // Measured data
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 2
  ctx.beginPath()
  measurements.forEach((m, i) => {
    const x = xOf(m.n)
    const y = yOf(m.operations)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.fillStyle = '#60a5fa'
  measurements.forEach((m) => {
    ctx.beginPath()
    ctx.arc(xOf(m.n), yOf(m.operations), 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

export default function ComplexityChart({
  sourceCode,
  language,
  classification,
  hasKey,
}: ComplexityChartProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(
    'idle'
  )
  const [progress, setProgress] = useState<{ n: number; index: number; total: number } | null>(null)
  const [measurements, setMeasurements] = useState<ComplexityMeasurement[] | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Authoritative, AI-independent complexity from the measured curve.
  const measuredBigO =
    measurements && measurements.length >= 2 ? estimateBigO(measurements) : null

  const supported = language === 'python' || language === 'javascript'

  useEffect(() => {
    if (measurements && canvasRef.current) drawChart(canvasRef.current, measurements)
  }, [measurements])

  async function classifyComplexity(data: ComplexityMeasurement[]) {
    if (!hasKey) return
    try {
      const text = await chatAI({
        maxTokens: 512,
        system:
          'You are an algorithm complexity analyst. Given operation counts ' +
          'measured at increasing input sizes, determine the empirical time ' +
          'complexity and the theoretically optimal complexity for this ' +
          'problem. Respond with ONLY a JSON object: {"observed": string, ' +
          '"optimal": string, "explanation": string}. Use Big-O like ' +
          '"O(n^2)". No markdown, no backticks.',
        messages: [
          {
            role: 'user',
            content:
              `Algorithm: ${classification?.label ?? 'unknown'}\n\n` +
              `Measurements (input size n -> operation count):\n` +
              data.map((m) => `n=${m.n}: ${m.operations} ops`).join('\n') +
              `\n\nWhat is the observed time complexity?`,
          },
        ],
      })
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAnalysis({
        observed: String(parsed.observed ?? '—'),
        optimal: String(parsed.optimal ?? '—'),
        explanation: String(parsed.explanation ?? ''),
      })
    } catch (err) {
      // Local measured complexity still shows; surface why the AI call failed.
      setAnalysisError(err instanceof Error ? err.message : String(err))
    }
  }

  const run = () => {
    if (!supported || status === 'running') return
    setStatus('running')
    setMeasurements(null)
    setAnalysis(null)
    setAnalysisError(null)
    setError(null)
    setProgress(null)
    const id = executionClient.runComplexity(
      language as 'python' | 'javascript',
      sourceCode,
      INPUT_SIZES,
      {
        onProgress: (p) => setProgress({ n: p.n, index: p.index, total: p.total }),
        onResult: (r) => {
          setMeasurements(r.measurements)
          setStatus('done')
          if (r.measurements.length > 0) void classifyComplexity(r.measurements)
        },
        onError: (e) => {
          setError(e.message)
          setStatus('error')
        },
      }
    )
    if (!id) {
      setError('Execution server not connected.')
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {!supported ? (
        <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>
          Complexity analysis currently supports Python and JavaScript only.
        </div>
      ) : (
        <>
          <button
            onClick={run}
            disabled={status === 'running'}
            style={{
              alignSelf: 'flex-start',
              background: '#2563eb',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              padding: '5px 12px',
              cursor: status === 'running' ? 'default' : 'pointer',
              opacity: status === 'running' ? 0.6 : 1,
            }}
          >
            {status === 'running' ? 'Running…' : 'Run Complexity Analysis'}
          </button>

          {status === 'running' && (
            <div style={{ fontSize: 11, color: '#a1a1aa' }}>
              {progress
                ? `Running n=${progress.n}… (${progress.index + 1}/${progress.total})`
                : 'Starting…'}
            </div>
          )}

          {error && (
            <div style={{ fontSize: 11, color: '#f87171' }}>{error}</div>
          )}

          {status === 'done' && measurements?.length === 0 && (
            <div style={{ fontSize: 11, color: '#71717a' }}>
              No input size completed within the time limit. Try a faster
              algorithm or smaller sizes.
            </div>
          )}

          {measurements && measurements.length > 0 && (
            <>
              <canvas
                ref={canvasRef}
                width={392}
                height={150}
                style={{ width: '100%', maxWidth: 392, background: '#0a0a0c', borderRadius: 6 }}
              />
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#71717a' }}>
                <span style={{ color: '#60a5fa' }}>● measured</span>
                {REFERENCE_CURVES.map((r) => {
                  const isFit = r.label === measuredBigO
                  return (
                    <span
                      key={r.label}
                      style={{ color: r.color, fontWeight: isFit ? 700 : 400 }}
                    >
                      ╌ {r.label}
                      {isFit ? ' ◀ fit' : ''}
                    </span>
                  )
                })}
              </div>

              {/* Authoritative measured complexity — computed from the data,
                  always shown regardless of the AI call. */}
              <div
                style={{
                  fontSize: 14,
                  color: '#e2e8f0',
                  background: '#18181b',
                  border: '1px solid #2a2a2f',
                  borderRadius: 6,
                  padding: '8px 10px',
                }}
              >
                Measured complexity:{' '}
                <strong style={{ color: '#f87171', fontSize: 16 }}>
                  {measuredBigO ?? '—'}
                </strong>
                <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>
                  fit from operation counts at n = {measurements.map((m) => m.n).join(', ')}
                </div>
              </div>

              {/* Optional AI enrichment: optimal algorithm + explanation. */}
              {analysis ? (
                <div style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: '#4ade80' }}>Optimal:</strong>{' '}
                    {analysis.optimal}
                  </div>
                  {analysis.explanation && (
                    <div style={{ marginTop: 4, color: '#a1a1aa' }}>
                      {analysis.explanation}
                    </div>
                  )}
                </div>
              ) : analysisError ? (
                <div style={{ fontSize: 11, color: '#f87171' }}>
                  AI explanation failed: {analysisError}
                </div>
              ) : hasKey ? (
                <div style={{ fontSize: 11, color: '#71717a' }}>
                  Getting AI explanation…
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#71717a' }}>
                  Add a Claude or Gemini API key for an AI explanation and
                  optimal-algorithm suggestion.
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
