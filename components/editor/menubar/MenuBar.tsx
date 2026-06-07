'use client'

import { useEffect, useRef, useState } from 'react'
import { MENU_DATA } from './menubar.data'
import MenuBarItem from './MenuBarItem'

// Ask the native shell (CEF) to act on the window. No-op in a normal browser.
function nativeWindow(method: string) {
  if (typeof window !== 'undefined' && typeof window.cefQuery === 'function') {
    window.cefQuery({
      request: JSON.stringify({ method }),
      onSuccess: () => {},
      onFailure: () => {},
    })
  }
}

type WindowControl = {
  id: string
  label: string
  symbol: string
  method: string
  hoverBg: string
  hoverColor: string
}

const WINDOW_CONTROLS: WindowControl[] = [
  { id: 'min', label: 'Minimize', symbol: '─', method: 'minimizeWindow', hoverBg: '#3a3a3a', hoverColor: '#8a8a8a' },
  { id: 'max', label: 'Maximize', symbol: '□', method: 'toggleMaximizeWindow', hoverBg: '#3a3a3a', hoverColor: '#8a8a8a' },
  { id: 'close', label: 'Close', symbol: '✕', method: 'closeWindow', hoverBg: '#e81123', hoverColor: '#ffffff' },
]

function WindowButton({ control }: { control: WindowControl }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      aria-label={control.label}
      onClick={() => nativeWindow(control.method)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '46px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: hovered ? control.hoverColor : '#8a8a8a',
        background: hovered ? control.hoverBg : 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {control.symbol}
    </button>
  )
}

export default function MenuBar() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '30px',
        flexShrink: 0,
        paddingLeft: '10px',
        background: '#1f1f1f',
        borderBottom: '1px solid #2d2d2d',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        overflow: 'visible',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '20px',
          height: '20px',
          marginRight: '8px',
          flexShrink: 0,
          borderRadius: '5px',
          background: '#534AB7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: '#ffffff',
        }}
      >
        A
      </div>

      {MENU_DATA.map((menu) => (
        <MenuBarItem
          key={menu.id}
          menu={menu}
          isOpen={openMenuId === menu.id}
          onOpen={() => setOpenMenuId(menu.id)}
          onClose={() => setOpenMenuId(null)}
          onHover={() => {
            if (openMenuId !== null) setOpenMenuId(menu.id)
          }}
        />
      ))}

      {/* Draggable region — the empty space acts like a native title bar:
          drag to move the window, double-click to maximize/restore. (Native
          shell only; no-op in a browser.) */}
      <div
        onMouseDown={(e) => {
          if (e.button === 0) nativeWindow('startWindowDrag')
        }}
        onDoubleClick={() => nativeWindow('toggleMaximizeWindow')}
        style={{ flex: 1, alignSelf: 'stretch' }}
      />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {WINDOW_CONTROLS.map((control) => (
          <WindowButton key={control.id} control={control} />
        ))}
      </div>
    </div>
  )
}
