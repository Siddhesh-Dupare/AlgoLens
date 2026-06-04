'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface SettingsPanelProps {
  onClose: () => void
  onApiKeyChange: (key: string) => void
}

export default function SettingsPanel({
  onClose,
  onApiKeyChange,
}: SettingsPanelProps) {
  const [claudeKey, setClaudeKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('algolens_api_key') ?? ''
    } catch {
      return ''
    }
  })
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('algolens_gemini_key') ?? ''
    } catch {
      return ''
    }
  })
  const [justSaved, setJustSaved] = useState(false)

  // Persist a key and let the rest of the app (Ask AI / complexity panels) pick
  // it up live via the apikey-changed event (subscribers re-read sessionStorage).
  const persist = (storageKey: string, value: string) => {
    try {
      sessionStorage.setItem(storageKey, value)
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(
        new CustomEvent('algolens:apikey-changed', { detail: { key: value } })
      )
    } catch {
      // ignore
    }
  }

  const updateClaude = (value: string) => {
    setClaudeKey(value)
    setJustSaved(false)
    persist('algolens_api_key', value)
    onApiKeyChange(value)
  }
  const updateGemini = (value: string) => {
    setGeminiKey(value)
    setJustSaved(false)
    persist('algolens_gemini_key', value)
  }

  const handleAdd = () => {
    updateClaude(claudeKey.trim())
    updateGemini(geminiKey.trim())
    setJustSaved(true)
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
          width: 460,
          maxWidth: '90vw',
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
            Settings
          </span>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#8a8a8a',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 3,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: '#cccccc',
              marginBottom: 4,
            }}
          >
            Claude API Key (optional)
          </label>
          <div style={{ fontSize: 11, color: '#6a6a6a', marginBottom: 8 }}>
            Used for Tier 3 classification and the AI features (narrator, Ask AI,
            complexity). Leave blank to use Tier 1 + Tier 2 only.
          </div>
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => updateClaude(e.target.value)}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoComplete="off"
            style={{
              width: '100%',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 5,
              color: '#e2e8f0',
              fontSize: 13,
              padding: '8px 10px',
              outline: 'none',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />

          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: '#cccccc',
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            Gemini API Key (optional)
          </label>
          <div style={{ fontSize: 11, color: '#6a6a6a', marginBottom: 8 }}>
            Alternative provider for the AI features — used automatically when
            set (e.g. if the Claude account has no credits).
          </div>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => updateGemini(e.target.value)}
            placeholder="AIza..."
            spellCheck={false}
            autoComplete="off"
            style={{
              width: '100%',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 5,
              color: '#e2e8f0',
              fontSize: 13,
              padding: '8px 10px',
              outline: 'none',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 12,
            }}
          >
            {justSaved && (
              <span style={{ fontSize: 12, color: '#22c55e' }}>Saved ✓</span>
            )}
            {(() => {
              const enabled = !!(claudeKey.trim() || geminiKey.trim())
              return (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!enabled}
                  style={{
                    background: enabled ? '#2563eb' : '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: 5,
                    color: enabled ? '#fff' : '#6a6a6a',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '7px 16px',
                    cursor: enabled ? 'pointer' : 'default',
                  }}
                >
                  Add API Key
                </button>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
