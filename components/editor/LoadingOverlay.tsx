'use client'

import { useEffect, useState } from 'react'

// C5 — covers the brief flash while Monaco (large) loads. Fades out when Monaco
// fires algolens:monaco-ready, with a ~1.5s minimum so the bar reads as intentional.
export default function LoadingOverlay() {
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const minTimer = setTimeout(() => setReady((r) => r || false), 0)
    let monacoReady = false
    let elapsedMin = false

    const maybeFade = () => {
      if (monacoReady && elapsedMin) setReady(true)
    }
    const onReady = () => {
      monacoReady = true
      maybeFade()
    }
    window.addEventListener('algolens:monaco-ready', onReady)
    const min = setTimeout(() => {
      elapsedMin = true
      maybeFade()
    }, 1500)
    // Safety: never trap the user behind the overlay.
    const safety = setTimeout(() => setReady(true), 6000)

    return () => {
      window.removeEventListener('algolens:monaco-ready', onReady)
      clearTimeout(min)
      clearTimeout(minTimer)
      clearTimeout(safety)
    }
  }, [])

  // Remove from the tree after the fade completes.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setHidden(true), 350)
    return () => clearTimeout(t)
  }, [ready])

  if (hidden) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: '#0a0a0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        opacity: ready ? 0 : 1,
        transition: 'opacity 350ms ease',
        pointerEvents: ready ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: '#534AB7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        A
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#e2e8f0' }}>
        AlgoLens
      </div>
      <div
        style={{
          width: 180,
          height: 3,
          borderRadius: 2,
          background: '#1c1c1f',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#534AB7',
            borderRadius: 2,
            animation: 'algolens-loadbar 1.5s ease-out forwards',
          }}
        />
      </div>
      <style>{`@keyframes algolens-loadbar { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}
