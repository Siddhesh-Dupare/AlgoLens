'use client'

import { useState } from 'react'
import type { TopLevelMenu } from './menubar.types'
import MenuBarDropdown from './MenuBarDropdown'

interface MenuBarItemProps {
  menu: TopLevelMenu
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onHover: () => void
}

export default function MenuBarItem({
  menu,
  isOpen,
  onOpen,
  onClose,
  onHover,
}: MenuBarItemProps) {
  const [hovered, setHovered] = useState(false)
  const showHover = hovered && !isOpen

  return (
    <div style={{ position: 'relative', height: '30px' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${menu.label} menu`}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onMouseEnter={() => {
          setHovered(true)
          onHover()
        }}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: '30px',
          padding: '0 8px',
          background: isOpen ? '#094771' : showHover ? '#2a2d2e' : 'transparent',
          color: isOpen ? '#ffffff' : showHover ? '#ffffff' : '#cccccc',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'inherit',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {menu.label}
      </button>

      {isOpen ? <MenuBarDropdown items={menu.items} onClose={onClose} /> : null}
    </div>
  )
}
