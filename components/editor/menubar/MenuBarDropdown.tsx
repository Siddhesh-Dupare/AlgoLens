'use client'

import { useState } from 'react'
import type { MenuItem } from './menubar.types'
import MenuBarSeparator from './MenuBarSeparator'

function handleMenuAction(id: string): void {
  switch (id) {
    case 'file-new':
      console.log('New File')
      break
    case 'edit-undo':
      console.log('Undo')
      break
    case 'edit-redo':
      console.log('Redo')
      break
    case 'edit-find':
      console.log('Find')
      break
    case 'edit-replace':
      console.log('Replace')
      break
    case 'view-zoom-in':
      window.dispatchEvent(
        new CustomEvent('algolens:zoom', { detail: { direction: 'in' } })
      )
      break
    case 'view-zoom-out':
      window.dispatchEvent(
        new CustomEvent('algolens:zoom', { detail: { direction: 'out' } })
      )
      break
    case 'view-zoom-reset':
      window.dispatchEvent(
        new CustomEvent('algolens:zoom', { detail: { direction: 'reset' } })
      )
      break
    case 'view-explorer':
      window.dispatchEvent(new CustomEvent('algolens:toggle-explorer'))
      break
    case 'view-terminal':
      window.dispatchEvent(new CustomEvent('algolens:toggle-terminal'))
      break
    case 'view-toggle-minimap':
      window.dispatchEvent(new CustomEvent('algolens:toggle-minimap'))
      break
    case 'view-toggle-wordwrap':
      window.dispatchEvent(new CustomEvent('algolens:toggle-wordwrap'))
      break
    case 'lang-python':
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', { detail: { language: 'python' } })
      )
      break
    case 'lang-javascript':
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', { detail: { language: 'javascript' } })
      )
      break
    case 'lang-cpp':
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', { detail: { language: 'cpp' } })
      )
      break
    case 'lang-c':
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', { detail: { language: 'c' } })
      )
      break
    case 'lang-java':
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', { detail: { language: 'java' } })
      )
      break
    case 'help-about':
      console.log('AlgoLens v1.0 — DSA Visualizer')
      break
    case 'help-shortcuts':
      console.log('Keyboard Shortcuts')
      break
    default:
      console.log('Menu action:', id)
  }
}

interface MenuBarDropdownProps {
  items: MenuItem[]
  onClose: () => void
}

interface ActionRowProps {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  onClose: () => void
}

function ActionRow({ id, label, shortcut, disabled, onClose }: ActionRowProps) {
  const [hovered, setHovered] = useState(false)
  const isHovered = hovered && !disabled

  return (
    <div
      role="menuitem"
      aria-disabled={disabled ? true : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (disabled) return
        handleMenuAction(id)
        onClose()
      }}
      style={{
        padding: '5px 12px 5px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        fontSize: '13px',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? '#5a5a5a' : isHovered ? '#ffffff' : '#cccccc',
        borderRadius: '3px',
        margin: '0 4px',
        background: isHovered ? '#094771' : 'transparent',
      }}
    >
      <span>{label}</span>
      {shortcut ? (
        <span
          style={{
            fontSize: '11px',
            color: disabled ? '#3a3a3a' : '#8a8a8a',
            whiteSpace: 'nowrap',
          }}
        >
          {shortcut}
        </span>
      ) : null}
    </div>
  )
}

export default function MenuBarDropdown({ items, onClose }: MenuBarDropdownProps) {
  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: '240px',
        background: '#252526',
        border: '1px solid #3c3c3c',
        borderRadius: '5px',
        padding: '4px 0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {items.map((item) =>
        item.type === 'separator' ? (
          <MenuBarSeparator key={item.id} />
        ) : (
          <ActionRow
            key={item.id}
            id={item.id}
            label={item.label}
            shortcut={item.shortcut}
            disabled={item.disabled}
            onClose={onClose}
          />
        )
      )}
    </div>
  )
}
