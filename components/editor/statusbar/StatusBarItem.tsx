'use client'

import { useState } from 'react'
import type { StatusBarItemData } from './statusbar.types'

interface StatusBarItemProps {
  item: StatusBarItemData
}

const VARIANT_COLORS: Record<
  NonNullable<StatusBarItemData['variant']>,
  { color: string; hoverBg: string }
> = {
  default: { color: '#8a8a8a', hoverBg: '#2a2d2e' },
  info: { color: '#75beff', hoverBg: '#1a3a5c' },
  success: { color: '#89d185', hoverBg: '#1a3a1a' },
  warning: { color: '#cca700', hoverBg: '#3a2e00' },
  error: { color: '#f48771', hoverBg: '#3a1a1a' },
}

export default function StatusBarItem({ item }: StatusBarItemProps) {
  const [hovered, setHovered] = useState(false)
  const variant = VARIANT_COLORS[item.variant ?? 'default']
  const clickable = Boolean(item.onClick)

  return (
    <div
      onClick={item.onClick}
      title={item.tooltip ?? ''}
      onMouseEnter={() => clickable && setHovered(true)}
      onMouseLeave={() => clickable && setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '0 8px',
        height: '100%',
        cursor: clickable ? 'pointer' : 'default',
        color: variant.color,
        fontSize: '12px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        borderRadius: '3px',
        background: hovered ? variant.hoverBg : 'transparent',
        transition: 'background 150ms, color 150ms',
      }}
    >
      {item.icon && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {item.icon}
        </span>
      )}

      <span>{item.label}</span>

      {item.value && (
        <span style={{ color: variant.color, opacity: 0.8 }}>
          {item.value}
        </span>
      )}
    </div>
  )
}
