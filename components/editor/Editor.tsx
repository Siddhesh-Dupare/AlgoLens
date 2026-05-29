'use client'

import { useCallback, useRef, useState } from 'react'
import MenuBar from './menubar/MenuBar'
import MonacoEditor from './monaco/MonacoEditor'
import FileExplorer from './explorer/FileExplorer'
import type { FileNode } from './explorer/explorer.types'

const MIN_WIDTH = 160
const MAX_WIDTH = 480

export default function Editor() {
  const [explorerWidth, setExplorerWidth] = useState(240)
  const draggingRef = useRef(false)

  const onFileSelect = useCallback((file: FileNode) => {
    if (file.language) {
      window.dispatchEvent(
        new CustomEvent('algolens:set-language', {
          detail: { language: file.language },
        })
      )
    }
    if (file.content !== undefined) {
      window.dispatchEvent(
        new CustomEvent('algolens:set-content', {
          detail: { content: file.content },
        })
      )
    }
  }, [])

  const handleMouseDown = useCallback(() => {
    draggingRef.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const next = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH)
      setExplorerWidth(next)
    }

    const handleMouseUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#1e1e1e',
      }}
    >
      <MenuBar />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: explorerWidth,
            flexShrink: 0,
            height: '100%',
            borderRight: '1px solid #2d2d2d',
            overflow: 'hidden',
          }}
        >
          <FileExplorer onFileSelect={onFileSelect} />
        </div>

        <div
          role="separator"
          aria-label="Resize file explorer"
          aria-orientation="vertical"
          onMouseDown={handleMouseDown}
          style={{
            width: 4,
            height: '100%',
            flexShrink: 0,
            cursor: 'col-resize',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#094771'
          }}
          onMouseLeave={(e) => {
            if (!draggingRef.current) e.currentTarget.style.background = 'transparent'
          }}
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <MonacoEditor />
        </div>
      </div>
    </div>
  )
}
