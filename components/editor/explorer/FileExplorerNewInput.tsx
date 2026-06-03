'use client'

import { useEffect, useRef, useState } from 'react'
import { File, Folder } from 'lucide-react'

interface FileExplorerNewInputProps {
  depth: number
  type: 'file' | 'folder'
  initialValue?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export default function FileExplorerNewInput({
  depth,
  type,
  initialValue = '',
  onConfirm,
  onCancel,
}: FileExplorerNewInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  // Guard so onBlur doesn't double-fire after Enter/Escape already resolved.
  const settledRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const confirm = () => {
    if (settledRef.current) return
    settledRef.current = true
    if (value.trim()) onConfirm(value.trim())
    else onCancel()
  }

  const cancel = () => {
    if (settledRef.current) return
    settledRef.current = true
    onCancel()
  }

  const Icon = type === 'folder' ? Folder : File

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 24,
        gap: 6,
        padding: `0 8px 0 ${depth * 16 + 8}px`,
      }}
    >
      <Icon size={14} color="#8a8a8a" style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter' && value.trim()) confirm()
          if (e.key === 'Escape') cancel()
        }}
        onBlur={confirm}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#3c3c3c',
          border: '1px solid #007acc',
          borderRadius: 3,
          color: '#cccccc',
          fontSize: 12,
          padding: '1px 6px',
          outline: 'none',
          width: '100%',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
