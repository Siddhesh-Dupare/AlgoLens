'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback } from 'react'
import type { OnMount } from '@monaco-editor/react'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1e1e1e',
        }}
      />
    ),
  }
)

const DEFAULT_CODE = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


data = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(data))
`

const MONACO_OPTIONS = {
  fontSize: 14,
  lineHeight: 22,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all' as const,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  smoothScrolling: true,
  contextmenu: false,
  folding: true,
  lineNumbers: 'on' as const,
  glyphMargin: true,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 4,
  padding: { top: 16, bottom: 16 },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'auto' as const,
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
    useShadows: false,
  },
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: false,
    indentation: true,
  },
  renderWhitespace: 'none' as const,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'off' as const,
  automaticLayout: false,
}

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      editor.layout()
    })

    observer.observe(container)

    editor.layout()

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1e1e1e',
        overflow: 'hidden',
      }}
    >
      <MonacoEditor
        height="100%"
        width="100%"
        language="python"
        theme="vs-dark"
        defaultValue={DEFAULT_CODE}
        options={MONACO_OPTIONS}
        onMount={handleMount}
      />
    </div>
  )
}
