'use client'

import { useState, useEffect } from 'react'

interface TerminalInputProps {
  onSubmit: (command: string) => void
  isDisabled?: boolean
  currentDirectory?: string
}

export default function TerminalInput({
  onSubmit,
  isDisabled,
  currentDirectory,
}: TerminalInputProps) {
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [fontSize, setFontSize] = useState(13)

  // Match the terminal output font to the global zoom level.
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent).detail.direction as string
      setFontSize((prev) => {
        if (dir === 'in') return Math.min(prev + 1, 24)
        if (dir === 'out') return Math.max(prev - 1, 10)
        if (dir === 'reset') return 13
        return prev
      })
    }
    window.addEventListener('algolens:zoom', handler)
    return () => window.removeEventListener('algolens:zoom', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = value.trim()
      if (trimmed === '') return
      onSubmit(trimmed)
      setHistory((prev) => [trimmed, ...prev].slice(0, 100))
      setValue('')
      setHistoryIndex(-1)
    } else if (e.key === 'ArrowUp') {
      if (history.length === 0) return
      e.preventDefault()
      const nextIndex = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(nextIndex)
      setValue(history[nextIndex])
    } else if (e.key === 'ArrowDown') {
      if (historyIndex <= 0) {
        setHistoryIndex(-1)
        setValue('')
      } else {
        const nextIndex = historyIndex - 1
        setHistoryIndex(nextIndex)
        setValue(history[nextIndex])
      }
    } else if (e.key === 'Escape') {
      setValue('')
      setHistoryIndex(-1)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        gap: '8px',
        borderTop: '1px solid #2d2d2d',
        background: '#1e1e1e',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#89d185',
          fontFamily: 'monospace',
          fontSize: fontSize,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {currentDirectory ? `${currentDirectory} $` : '$'}
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Terminal input"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#cccccc',
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: fontSize,
          lineHeight: '1.6',
          caretColor: '#cccccc',
        }}
      />
    </div>
  )
}
