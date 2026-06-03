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
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('algolens_api_key') ?? ''
    } catch {
      return ''
    }
  })

  const update = (value: string) => {
    setApiKey(value)
    try {
      sessionStorage.setItem('algolens_api_key', value)
    } catch {
      // ignore
    }
    onApiKeyChange(value)
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
            Used for Tier 3 algorithm classification. Leave blank to use Tier 1
            + Tier 2 only.
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => update(e.target.value)}
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
        </div>
      </div>
    </div>
  )
}
