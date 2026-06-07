'use client'

import { useEffect, useState } from 'react'

// C1 — shown on first launch only (gated by localStorage). Three quick steps so
// study participants are productive in under a minute.
const STORAGE_KEY = 'algolens_first_launch'

interface Step {
  title: string
  body: string
  cta: string
}

const STEPS: Step[] = [
  {
    title: 'Open a folder with your DSA code',
    body: 'Click “Open Folder” in the Explorer to load your algorithms.',
    cta: 'Next',
  },
  {
    title: 'Click Debug to visualize any algorithm',
    body: 'AlgoLens runs your code, detects the algorithm, and builds a live visualization.',
    cta: 'Next',
  },
  {
    title: 'Step through execution frame by frame',
    body: 'Use Step Forward / Back to watch the algorithm work — with narration and the visual panel.',
    cta: 'Get started',
  },
]

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  // Only decide visibility on the client (localStorage) to stay export-safe.
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      /* storage unavailable — skip onboarding */
    }
  }, [])

  if (!visible) return null

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const s = STEPS[step]
  const advance = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish())

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '90vw',
          background: '#1e1e1e',
          border: '1px solid #3c3c3c',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === step ? '#534AB7' : '#3f3f46',
                transition: 'all 150ms ease',
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 6 }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
          {s.title}
        </div>
        <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 22 }}>
          {s.body}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={finish}
            style={{
              background: 'transparent',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              color: '#a1a1aa',
              fontSize: 13,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={advance}
            style={{
              background: '#534AB7',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            {s.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
