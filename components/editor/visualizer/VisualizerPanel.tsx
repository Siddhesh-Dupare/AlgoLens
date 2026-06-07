'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useClassifierStore } from '@/store/useClassifierStore'
import { hasAIKey } from '@/lib/ai/client'
import AlgorithmBadge from './AlgorithmBadge'
import IRPreview from './IRPreview'
import FrameScrubber from './FrameScrubber'
import QAPanel from './QAPanel'

// SSR/static-export-safe: is any AI key (Claude or Gemini) set? useSyncExternalStore
// returns the server snapshot (false) during prerender and first hydration, then
// the real value on the client — so the markup matches and there is no hydration
// mismatch — and re-evaluates whenever a key changes in Settings.
function subscribeKeys(cb: () => void): () => void {
  window.addEventListener('algolens:apikey-changed', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('algolens:apikey-changed', cb)
    window.removeEventListener('storage', cb)
  }
}
function useHasAIKey(): boolean {
  return useSyncExternalStore(
    subscribeKeys,
    () => hasAIKey(),
    () => false
  )
}

export default function VisualizerPanel() {
  const output = useClassifierStore((s) => s.output)
  const isClassifying = useClassifierStore((s) => s.isClassifying)
  const isNarrating = useClassifierStore((s) => s.isNarrating)
  const classifyLatencyMs = useClassifierStore((s) => s.classifyLatencyMs)
  const currentIRFrame = useClassifierStore((s) => s.currentIRFrame)
  const irFrameIndex = useClassifierStore((s) => s.irFrameIndex)
  const setIRFrameIndex = useClassifierStore((s) => s.setIRFrameIndex)

  // Detect the native (CEF) shell once. Lazy initializer — not a setState in an
  // effect, which this codebase's React build rejects — and SSR/export-safe
  // (window is undefined during the static export, so this resolves to false).
  const [isNative] = useState(
    () => typeof window !== 'undefined' && typeof window.cefQuery === 'function'
  )

  // Q&A panel (Phase 6). The API key is read SSR-safely and stays in sync with
  // Settings via the hook above (no hydration mismatch, no manual listener).
  const [qaOpen, setQaOpen] = useState(false)
  const hasKey = useHasAIKey()

  const handleAskAi = () => {
    if (!hasKey) {
      // No key yet — open Settings so the user can add one.
      window.dispatchEvent(new CustomEvent('algolens:open-settings'))
      return
    }
    setQaOpen((o) => !o)
  }

  // Push each Visual IR frame to the native renderer and keep the hidden DOM
  // mirror in sync. Pure external sync — no setState here.
  useEffect(() => {
    if (!currentIRFrame) return
    const json = JSON.stringify(currentIRFrame)

    const el = document.getElementById('algolens-ir-output')
    if (el) el.textContent = json

    if (typeof window.cefQuery === 'function') {
      window.cefQuery({
        request: JSON.stringify({ method: 'writeVisualIR', data: json }),
        onSuccess: () => {},
        onFailure: () => {},
      })
    }
  }, [currentIRFrame])

  // Native mode: report the on-screen rect of the visualization mount element so
  // the shell can position the docked SDL renderer exactly over it. Re-report on
  // element resize, window resize, and layout toggles (algolens:relayout).
  useEffect(() => {
    if (!isNative) return
    const report = () => {
      const el = document.getElementById('algolens-sdl3-mount')
      if (!el || typeof window.cefQuery !== 'function') return
      const r = el.getBoundingClientRect()
      // getBoundingClientRect is in CSS px; the docked child window is positioned
      // in physical px (CEF is DPI-aware), so scale by devicePixelRatio.
      const dpr = window.devicePixelRatio || 1
      window.cefQuery({
        request: JSON.stringify({
          method: 'setRendererBounds',
          x: Math.round(r.left * dpr),
          y: Math.round(r.top * dpr),
          width: Math.round(r.width * dpr),
          height: Math.round(r.height * dpr),
        }),
        onSuccess: () => {},
        onFailure: () => {},
      })
    }
    report()
    const el = document.getElementById('algolens-sdl3-mount')
    const ro = el ? new ResizeObserver(report) : null
    if (el && ro) ro.observe(el)
    window.addEventListener('resize', report)
    window.addEventListener('algolens:relayout', report)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', report)
      window.removeEventListener('algolens:relayout', report)
    }
  }, [isNative])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0a0c',
      }}
    >
      {/* Hidden Visual-IR output: mirrors the current frame as JSON so the
          native shell can also read it from the DOM if needed (Phase 5). */}
      <div id="algolens-ir-output" style={{ display: 'none' }} aria-hidden="true">
        {currentIRFrame ? JSON.stringify(currentIRFrame) : ''}
      </div>

      <AlgorithmBadge
        classification={output?.classification ?? null}
        isClassifying={isClassifying}
        isNarrating={isNarrating}
        latencyMs={classifyLatencyMs}
      />

      {/* Ask AI toolbar row — below the badge so it never overlaps the tier
          chip. With no key it opens Settings; otherwise it toggles the panel. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '6px 12px',
          borderBottom: '1px solid #1c1c1f',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleAskAi}
          title={
            hasKey
              ? 'Ask AI about this step'
              : 'Add a Claude or Gemini API key to enable AI features'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: qaOpen ? '#2563eb' : '#1c1c1f',
            color: hasKey ? '#e2e8f0' : '#a1a1aa',
            border: '1px solid #2a2a2f',
            borderRadius: 6,
            fontSize: 11,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          💬 {hasKey ? 'Ask AI' : 'Add API key'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isNative ? (
          // The docked SDL3 window is positioned over this element; its
          // viewport rect is reported to the shell via setRendererBounds.
          <div
            id="algolens-sdl3-mount"
            style={{ width: '100%', height: '100%', background: '#0a0a0c' }}
          />
        ) : isClassifying && !currentIRFrame ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: '#8a8a8a',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                border: '3px solid #2a2a2f',
                borderTopColor: '#007acc',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 13 }}>Capturing &amp; analyzing trace…</span>
          </div>
        ) : (
          <IRPreview
            frame={currentIRFrame}
            algorithmClass={output?.classification.algorithmClass ?? null}
          />
        )}
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

      <QAPanel
        isOpen={qaOpen}
        onClose={() => setQaOpen(false)}
        currentFrame={currentIRFrame}
        classification={output?.classification ?? null}
        sourceCode={output?.sourceCode ?? ''}
        language={output?.language ?? ''}
        hasKey={hasKey}
      />
    </div>
  )
}
