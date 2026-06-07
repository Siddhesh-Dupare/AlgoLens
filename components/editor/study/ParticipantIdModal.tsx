'use client'

import { useState } from 'react'

interface ParticipantIdModalProps {
  mode: 'study' | 'control'
  onSubmit: (participantId: string) => void
  onClose: () => void
}

export default function ParticipantIdModal({
  mode,
  onSubmit,
  onClose,
}: ParticipantIdModalProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const id = value.trim()
    if (id) onSubmit(id)
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
        zIndex: 2100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360,
          maxWidth: '90vw',
          background: '#0a0a14',
          border: '1px solid #2a2a4f',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>
          {mode === 'control' ? 'Control Mode' : 'Study Mode'}
        </div>
        <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 12 }}>
          Enter the participant ID to begin the session.
          {mode === 'control' &&
            ' Visualization and AI features will be hidden for this participant.'}
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onClose()
          }}
          placeholder="e.g. P01"
          style={{
            width: '100%',
            background: '#1c1c2e',
            border: '1px solid #2a2a4f',
            borderRadius: 5,
            color: '#e2e8f0',
            fontSize: 14,
            padding: '8px 10px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a4f',
              borderRadius: 5,
              color: '#a1a1aa',
              fontSize: 13,
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            style={{
              background: value.trim() ? '#4f46e5' : '#27272a',
              border: 'none',
              borderRadius: 5,
              color: value.trim() ? '#fff' : '#6a6a6a',
              fontSize: 13,
              fontWeight: 500,
              padding: '7px 16px',
              cursor: value.trim() ? 'pointer' : 'default',
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
