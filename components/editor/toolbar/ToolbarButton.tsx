'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

type ToolbarVariant = 'default' | 'run' | 'debug' | 'step' | 'danger'

interface ToolbarButtonProps {
  label?: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  isActive?: boolean
  isLoading?: boolean
  variant?: ToolbarVariant
  tooltip: string
  shortcut?: string
  size?: 'sm' | 'md'
}

interface VariantStyle {
  idleBg: string
  idleColor: string
  hoverBg: string
  hoverColor: string
  activeBg: string
  activeColor: string
  disabledBg: string
  disabledColor: string
}

const VARIANT_STYLES: Record<ToolbarVariant, VariantStyle> = {
  default: {
    idleBg: 'transparent',
    idleColor: '#8a8a8a',
    hoverBg: '#2a2d2e',
    hoverColor: '#cccccc',
    activeBg: '#37373d',
    activeColor: '#cccccc',
    disabledBg: 'transparent',
    disabledColor: '#3c3c3c',
  },
  run: {
    idleBg: '#166534',
    idleColor: '#86efac',
    hoverBg: '#15803d',
    hoverColor: '#bbf7d0',
    activeBg: '#14532d',
    activeColor: '#86efac',
    disabledBg: '#1a2e1f',
    disabledColor: '#2d5a37',
  },
  debug: {
    idleBg: '#1e3a5f',
    idleColor: '#93c5fd',
    hoverBg: 'rgba(29, 78, 216, 0.3)',
    hoverColor: '#bfdbfe',
    activeBg: '#1e3a5f',
    activeColor: '#93c5fd',
    disabledBg: '#1a2535',
    disabledColor: '#2d4a6a',
  },
  step: {
    idleBg: 'transparent',
    idleColor: '#a1a1aa',
    hoverBg: '#2a2d2e',
    hoverColor: '#cccccc',
    activeBg: '#1e3a5f',
    activeColor: '#93c5fd',
    disabledBg: 'transparent',
    disabledColor: '#3c3c3c',
  },
  danger: {
    idleBg: '#7f1d1d',
    idleColor: '#fca5a5',
    hoverBg: '#991b1b',
    hoverColor: '#fecaca',
    activeBg: '#7f1d1d',
    activeColor: '#fca5a5',
    disabledBg: 'transparent',
    disabledColor: '#3c3c3c',
  },
}

export default function ToolbarButton({
  label,
  icon,
  onClick,
  disabled = false,
  isActive = false,
  isLoading = false,
  variant = 'default',
  tooltip,
  shortcut,
  size = 'md',
}: ToolbarButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const s = VARIANT_STYLES[variant]
  const busy = disabled || isLoading

  let background = s.idleBg
  let color = s.idleColor
  if (disabled) {
    background = s.disabledBg
    color = s.disabledColor
  } else if (isActive) {
    background = s.activeBg
    color = s.activeColor
  } else if (isHovered) {
    background = s.hoverBg
    color = s.hoverColor
  }

  return (
    <button
      type="button"
      onClick={busy ? undefined : onClick}
      disabled={busy}
      title={`${tooltip}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={tooltip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size === 'sm' ? '4px' : '5px',
        padding: size === 'sm' ? '3px 7px' : '4px 10px',
        height: size === 'sm' ? '24px' : '28px',
        background,
        color,
        border: 'none',
        borderRadius: '5px',
        cursor: busy ? 'not-allowed' : 'pointer',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontFamily: 'inherit',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms, color 120ms, opacity 120ms',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {isLoading ? (
        <span
          style={{
            width: size === 'sm' ? 12 : 14,
            height: size === 'sm' ? 12 : 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}

      {label && <span style={{ fontWeight: 500 }}>{label}</span>}
    </button>
  )
}
