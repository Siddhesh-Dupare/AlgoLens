'use client'

import { X } from 'lucide-react'

interface ShortcutsDialogProps {
  onClose: () => void
}

const SHORTCUTS: Array<[string, string]> = [
  ['F5', 'Run code'],
  ['F9', 'Debug code'],
  ['F10', 'Step Forward'],
  ['F11', 'Step Back'],
  ['F8', 'Play Through'],
  ['Shift+F5', 'Stop execution'],
  ['Ctrl+S', 'Save file'],
  ['Ctrl+`', 'Toggle terminal'],
  ['Ctrl+Shift+E', 'Toggle explorer'],
  ['Ctrl+Shift+X', 'Toggle editor'],
  ['Ctrl+K', 'Open API key settings'],
]

export default function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
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
          width: 420,
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
            Keyboard Shortcuts
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

        <div style={{ padding: '8px 0', maxHeight: '60vh', overflowY: 'auto' }}>
          {SHORTCUTS.map(([keys, desc]) => (
            <div
              key={keys}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 16px',
                fontSize: 13,
                color: '#cccccc',
              }}
            >
              <span>{desc}</span>
              <kbd
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: '#e2e8f0',
                  background: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: 4,
                  padding: '2px 8px',
                }}
              >
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
