'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  runBenchmark,
  resultsToCSV,
  type BenchmarkResults,
} from '@/lib/benchmark/classifierBenchmark'

interface BenchmarkDialogProps {
  onClose: () => void
}

export default function BenchmarkDialog({ onClose }: BenchmarkDialogProps) {
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running')
  const [progress, setProgress] = useState({ done: 0, total: 0, name: '' })
  const [results, setResults] = useState<BenchmarkResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // guard against StrictMode double-run
    started.current = true
    const apiKey = (() => {
      try {
        return sessionStorage.getItem('algolens_api_key') ?? ''
      } catch {
        return ''
      }
    })()
    runBenchmark({
      apiKey,
      onProgress: (done, total, name) => setProgress({ done, total, name }),
    })
      .then((r) => {
        setResults(r)
        setStatus('done')
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setStatus('error')
      })
  }, [])

  const copy = (label: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: '94vw',
          maxHeight: '88vh',
          background: '#1e1e1e',
          border: '1px solid #3c3c3c',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid #2d2d2d',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
            Classifier Benchmark
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8a8a',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto' }}>
          {status === 'running' && (
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>
              Running {progress.done}/{progress.total || '…'}…
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>
                {progress.name}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>
          )}

          {status === 'done' && results && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  fontSize: 13,
                  color: '#e2e8f0',
                  marginBottom: 12,
                }}
              >
                <span>
                  <strong style={{ color: '#22c55e' }}>Precision:</strong>{' '}
                  {pct(results.precision)} ({results.correct}/{results.totalTests})
                </span>
                <span>
                  <strong>Avg latency:</strong> {results.avgLatencyMs.toFixed(1)}ms
                </span>
                <span style={{ color: '#4ecdc4' }}>
                  Tier1 {pct(results.tier1HitRate)}
                </span>
                <span style={{ color: '#75beff' }}>
                  Tier2 {pct(results.tier2HitRate)}
                </span>
                <span style={{ color: '#c084fc' }}>
                  Tier3 {pct(results.tier3HitRate)}
                </span>
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                  color: '#cccccc',
                }}
              >
                <thead>
                  <tr style={{ color: '#71717a', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Algorithm</th>
                    <th style={{ padding: '4px 6px' }}>Tested</th>
                    <th style={{ padding: '4px 6px' }}>Correct</th>
                    <th style={{ padding: '4px 6px' }}>Precision</th>
                    <th style={{ padding: '4px 6px' }}>Avg Conf.</th>
                    <th style={{ padding: '4px 6px' }}>T1</th>
                    <th style={{ padding: '4px 6px' }}>T2</th>
                    <th style={{ padding: '4px 6px' }}>T3</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.byAlgorithm).map(([algo, s]) => (
                    <tr key={algo} style={{ borderTop: '1px solid #2a2a2f' }}>
                      <td style={{ padding: '4px 6px' }}>{algo}</td>
                      <td style={{ padding: '4px 6px' }}>{s.tested}</td>
                      <td style={{ padding: '4px 6px' }}>{s.correct}</td>
                      <td style={{ padding: '4px 6px' }}>
                        {pct(s.correct / s.tested)}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        {pct(s.avgConfidence)}
                      </td>
                      <td style={{ padding: '4px 6px' }}>{s.tier1Detections}</td>
                      <td style={{ padding: '4px 6px' }}>{s.tier2Detections}</td>
                      <td style={{ padding: '4px 6px' }}>{s.tier3Detections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() =>
                    copy('json', JSON.stringify(results, null, 2))
                  }
                  style={btnStyle}
                >
                  {copied === 'json' ? 'Copied ✓' : 'Copy as JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => copy('csv', resultsToCSV(results))}
                  style={btnStyle}
                >
                  {copied === 'csv' ? 'Copied ✓' : 'Copy as CSV'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 5,
  color: '#fff',
  fontSize: 12,
  fontWeight: 500,
  padding: '7px 14px',
  cursor: 'pointer',
}
