'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState } from 'react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'

const MonacoEditorLib = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }} />
  ),
})

export default function MonacoEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
  const execDecorationsRef = useRef<string[]>([])

  const [language, setLanguage] = useState<string>('plaintext')
  const [fontSize, setFontSize] = useState<number>(14)
  const [minimapEnabled, setMinimapEnabled] = useState<boolean>(false)
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off')

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco
  }, [])

  // Open Monaco's command palette robustly (action id can vary by build).
  const openCommandPalette = useCallback(() => {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    const action = ed.getAction('editor.action.quickCommand')
    if (action) {
      action.run()
    } else {
      ed.trigger('keyboard', 'editor.action.quickCommand', null)
    }
  }, [])

  const handleMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Toggle the terminal even when Monaco has keyboard focus.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      window.dispatchEvent(new CustomEvent('algolens:toggle-terminal'))
    })

    // Execution / debug shortcuts (dispatched as events; Editor.tsx handles them).
    editor.addCommand(monaco.KeyCode.F5, () => {
      window.dispatchEvent(new CustomEvent('algolens:run'))
    })
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F5, () => {
      window.dispatchEvent(new CustomEvent('algolens:stop'))
    })
    editor.addCommand(monaco.KeyCode.F9, () => {
      window.dispatchEvent(new CustomEvent('algolens:debug'))
    })
    editor.addCommand(monaco.KeyCode.F10, () => {
      window.dispatchEvent(new CustomEvent('algolens:step-forward'))
    })
    editor.addCommand(monaco.KeyCode.F11, () => {
      window.dispatchEvent(new CustomEvent('algolens:step-back'))
    })
    editor.addCommand(monaco.KeyCode.F8, () => {
      window.dispatchEvent(new CustomEvent('algolens:play-through'))
    })

    // Save (Ctrl/Cmd+S) even when Monaco has focus.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      window.dispatchEvent(new CustomEvent('algolens:save'))
    })

    // Command palette (Ctrl/Cmd+Shift+P).
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => openCommandPalette()
    )

    // Report cursor position and line count to the status bar.
    editor.onDidChangeCursorPosition((e) => {
      window.dispatchEvent(
        new CustomEvent('algolens:cursor-position', {
          detail: { line: e.position.lineNumber, column: e.position.column },
        })
      )
    })

    editor.onDidChangeModelContent((e) => {
      const lineCount = editor.getModel()?.getLineCount() ?? 0
      window.dispatchEvent(
        new CustomEvent('algolens:line-count', {
          detail: { count: lineCount },
        })
      )
      // isFlush is true only for programmatic setValue (file open / tab switch /
      // save) — not user typing. Only real edits should mark a tab dirty.
      if (e.isFlush) return
      window.dispatchEvent(
        new CustomEvent('algolens:content-changed', {
          detail: { content: editor.getValue() },
        })
      )
    })

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

  // Language switching via custom event (just sets the syntax language).
  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent).detail.language as string
      setLanguage(lang)
    }
    window.addEventListener('algolens:set-language', handler)
    return () => window.removeEventListener('algolens:set-language', handler)
  }, [])

  // Zoom via custom event.
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent).detail.direction as string
      setFontSize((prev) => {
        if (dir === 'in') return Math.min(prev + 1, 28)
        if (dir === 'out') return Math.max(prev - 1, 10)
        if (dir === 'reset') return 14
        return prev
      })
    }
    window.addEventListener('algolens:zoom', handler)
    return () => window.removeEventListener('algolens:zoom', handler)
  }, [])

  // Toggle minimap via custom event.
  useEffect(() => {
    const handler = () => setMinimapEnabled((prev) => !prev)
    window.addEventListener('algolens:toggle-minimap', handler)
    return () => window.removeEventListener('algolens:toggle-minimap', handler)
  }, [])

  // Toggle word wrap via custom event.
  useEffect(() => {
    const handler = () => setWordWrap((prev) => (prev === 'off' ? 'on' : 'off'))
    window.addEventListener('algolens:toggle-wordwrap', handler)
    return () => window.removeEventListener('algolens:toggle-wordwrap', handler)
  }, [])

  // Load file content imperatively when a file/tab is selected, then focus the
  // editor so the user can type right away (delayed so the tab click settles).
  useEffect(() => {
    const handler = (e: Event) => {
      const content = (e as CustomEvent).detail.content as string
      const ed = editorRef.current
      if (!ed) return
      ed.setValue(content)
      setTimeout(() => ed.focus(), 50)
    }
    window.addEventListener('algolens:set-content', handler)
    return () => window.removeEventListener('algolens:set-content', handler)
  }, [])

  // Find / Replace / Command palette triggered from the menu bar.
  useEffect(() => {
    const onFind = () => editorRef.current?.getAction('actions.find')?.run()
    const onReplace = () =>
      editorRef.current
        ?.getAction('editor.action.startFindReplaceAction')
        ?.run()
    const onPalette = () => openCommandPalette()
    window.addEventListener('algolens:find', onFind)
    window.addEventListener('algolens:replace', onReplace)
    window.addEventListener('algolens:command-palette', onPalette)
    return () => {
      window.removeEventListener('algolens:find', onFind)
      window.removeEventListener('algolens:replace', onReplace)
      window.removeEventListener('algolens:command-palette', onPalette)
    }
  }, [openCommandPalette])

  // Broadcast word-wrap / minimap state so the View menu can show checkmarks,
  // and answer state requests when a menu opens (it mounts after changes fire).
  useEffect(() => {
    const wrapOn = wordWrap === 'on'
    window.dispatchEvent(
      new CustomEvent('algolens:wordwrap-state', { detail: { enabled: wrapOn } })
    )
    window.dispatchEvent(
      new CustomEvent('algolens:minimap-state', {
        detail: { enabled: minimapEnabled },
      })
    )
    const onRequest = () => {
      window.dispatchEvent(
        new CustomEvent('algolens:wordwrap-state', {
          detail: { enabled: wordWrap === 'on' },
        })
      )
      window.dispatchEvent(
        new CustomEvent('algolens:minimap-state', {
          detail: { enabled: minimapEnabled },
        })
      )
    }
    window.addEventListener('algolens:request-toggle-state', onRequest)
    return () =>
      window.removeEventListener('algolens:request-toggle-state', onRequest)
  }, [wordWrap, minimapEnabled])

  // Relayout when the surrounding layout changes (e.g. terminal opens/resizes).
  useEffect(() => {
    const handler = () => editorRef.current?.layout()
    window.addEventListener('algolens:relayout', handler)
    return () => window.removeEventListener('algolens:relayout', handler)
  }, [])

  // Move the executing-line arrow during debug (real-time capture + stepping).
  useEffect(() => {
    const onLine = (e: Event) => {
      const line = (e as CustomEvent).detail.line as number
      const editor = editorRef.current
      const monaco = monacoRef.current
      if (!editor || !monaco || !line) return
      execDecorationsRef.current = editor.deltaDecorations(
        execDecorationsRef.current,
        [
          {
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: 'executing-line-highlight',
              glyphMarginClassName: 'executing-line-glyph',
            },
          },
        ]
      )
      editor.revealLineInCenter(line)
    }
    const onClear = () => {
      const editor = editorRef.current
      if (editor) {
        execDecorationsRef.current = editor.deltaDecorations(
          execDecorationsRef.current,
          []
        )
      }
    }
    window.addEventListener('algolens:executing-line', onLine)
    window.addEventListener('algolens:clear-execution', onClear)
    return () => {
      window.removeEventListener('algolens:executing-line', onLine)
      window.removeEventListener('algolens:clear-execution', onClear)
    }
  }, [])

  // Keep the model's syntax language in sync with the language state.
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }, [language])

  // Apply live option changes to the editor.
  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize,
      minimap: { enabled: minimapEnabled },
      wordWrap,
    })
  }, [fontSize, minimapEnabled, wordWrap])

  const monacoOptions = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.6),
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    minimap: { enabled: minimapEnabled },
    wordWrap,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all' as const,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    smoothScrolling: true,
    contextmenu: true,
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
    guides: { bracketPairs: false, indentation: true },
    renderWhitespace: 'none' as const,
    tabSize: 4,
    insertSpaces: true,
    automaticLayout: false,
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#1e1e1e',
        overflow: 'hidden',
      }}
    >
      <MonacoEditorLib
        height="100%"
        width="100%"
        language={language}
        theme="vs-dark"
        defaultValue=""
        options={monacoOptions}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
      />
    </div>
  )
}
