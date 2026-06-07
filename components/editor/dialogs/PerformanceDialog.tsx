'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { executionClient } from '@/lib/executionClient'
import { useClassifierStore } from '@/store/useClassifierStore'
import type { Language } from '@/lib/executionTypes'

interface PerformanceDialogProps {
  onClose: () => void
}

interface LangResult {
  language: string
  runMs: number
  debugMs: number
  overhead: number
  error?: string
}

interface PerfReport {
  byLanguage: LangResult[]
  classificationLatencyMs: number
}

const ITERATIONS = 2

const SAMPLES: Array<{ language: Language; code: string }> = [
  {
    language: 'python',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(bubble_sort([64, 34, 25, 12, 22, 11, 90, 45, 33, 7]))
`,
  },
  {
    language: 'javascript',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const t = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = t;
      }
    }
  }
  return arr;
}
console.log(bubbleSort([64, 34, 25, 12, 22, 11, 90, 45, 33, 7]));
`,
  },
]

export default function PerformanceDialog({ onClose }: PerformanceDialogProps) {
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running')
  const [progress, setProgress] = useState('')
  const [report, setReport] = useState<PerfReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function measure(language: Language, code: string): Promise<LangResult> {
      const file = `perf.${language === 'python' ? 'py' : 'js'}`
      let runTotal = 0
      let dbgTotal = 0
      for (let i = 0; i < ITERATIONS; i++) {
        setProgress(`${language}: run ${i + 1}/${ITERATIONS}`)
        const t = performance.now()
        await executionClient.runOnce(language, code, file)
        runTotal += performance.now() - t
      }
      for (let i = 0; i < ITERATIONS; i++) {
        setProgress(`${language}: debug ${i + 1}/${ITERATIONS}`)
        const t = performance.now()
        await executionClient.traceOnce(language, code, file)
        dbgTotal += performance.now() - t
      }
      const runMs = runTotal / ITERATIONS
      const debugMs = dbgTotal / ITERATIONS
      return { language, runMs, debugMs, overhead: runMs ? debugMs / runMs : 0 }
    }

    async function run() {
      if (!executionClient.isConnected()) {
        setError('Execution server not connected — start it and try again.')
        setStatus('error')
        return
      }
      const byLanguage: LangResult[] = []
      for (const s of SAMPLES) {
        try {
          byLanguage.push(await measure(s.language, s.code))
        } catch (e) {
          byLanguage.push({
            language: s.language,
            runMs: 0,
            debugMs: 0,
            overhead: 0,
            error: e instanceof Error ? e.message : String(e),
          })
        }
      }
      setReport({
        byLanguage,
        classificationLatencyMs: useClassifierStore.getState().classifyLatencyMs,
      })
      setStatus('done')
    }
    run()
  }, [])

  const copy = () => {
    if (!report) return
    navigator.clipboard?.writeText(JSON.stringify(report, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

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
          width: 520,
          maxWidth: '92vw',
          background: '#1e1e1e',
          border: '1px solid #3c3c3c',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
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
            Performance Report
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

        <div style={{ padding: 16 }}>
          {status === 'running' && (
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>
              Measuring… {progress}
            </div>
          )}
          {status === 'error' && (
            <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>
          )}
          {status === 'done' && report && (
            <>
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
                    <th style={{ padding: '4px 6px' }}>Language</th>
                    <th style={{ padding: '4px 6px' }}>Run (ms)</th>
                    <th style={{ padding: '4px 6px' }}>Debug (ms)</th>
                    <th style={{ padding: '4px 6px' }}>Trace overhead</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byLanguage.map((r) => (
                    <tr key={r.language} style={{ borderTop: '1px solid #2a2a2f' }}>
                      <td style={{ padding: '4px 6px' }}>{r.language}</td>
                      {r.error ? (
                        <td colSpan={3} style={{ padding: '4px 6px', color: '#f87171' }}>
                          {r.error}
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: '4px 6px' }}>{r.runMs.toFixed(0)}</td>
                          <td style={{ padding: '4px 6px' }}>{r.debugMs.toFixed(0)}</td>
                          <td style={{ padding: '4px 6px', color: '#fbbf24' }}>
                            {r.overhead.toFixed(2)}×
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 12 }}>
                Classification latency:{' '}
                <strong style={{ color: '#e2e8f0' }}>
                  {report.classificationLatencyMs.toFixed(1)} ms
                </strong>{' '}
                (last run)
              </div>
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>
                Visualization FPS is shown in the corner of the native SDL window
                during a debug session.
              </div>

              <button
                type="button"
                onClick={copy}
                style={{
                  marginTop: 16,
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: 5,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '7px 14px',
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy as JSON'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
