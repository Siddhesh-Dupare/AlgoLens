'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import MenuBar from './menubar/MenuBar'
import MonacoEditor from './monaco/MonacoEditor'
import FileExplorer from './explorer/FileExplorer'
import EditorTabs from './tabs/EditorTabs'
import Terminal from './terminal/Terminal'
import type { TerminalHandle } from './terminal/Terminal'
import StatusBar from './statusbar/StatusBar'
import EditorToolbar from './toolbar/EditorToolbar'
import type {
  ToolbarMode,
  SupportedLanguage,
  StepState,
} from './toolbar/toolbar.types'
import type { FileNode } from './explorer/explorer.types'
import type { TabItem } from './tabs/tabs.types'
import { readFileContent, getMonacoLanguage } from './explorer/filesystemUtils'

type StatusVariant = 'default' | 'info' | 'success' | 'warning' | 'error'

function dispatchContent(content: string) {
  window.dispatchEvent(
    new CustomEvent('algolens:set-content', { detail: { content } })
  )
}

function dispatchLanguage(language: string) {
  window.dispatchEvent(
    new CustomEvent('algolens:set-language', { detail: { language } })
  )
}

function WelcomeScreen() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1e1e',
        color: '#3c3c3c',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: '#252526',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: '#534AB7',
        }}
      >
        A
      </div>
      <div style={{ fontSize: 20, color: '#5a5a5a', fontWeight: 500 }}>
        AlgoLens
      </div>
      <div style={{ fontSize: 13, color: '#3c3c3c' }}>
        Open a folder to get started
      </div>
    </div>
  )
}

export default function Editor() {
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [explorerWidth, setExplorerWidth] = useState(240)

  // Panel visibility
  const [isExplorerVisible, setIsExplorerVisible] = useState(true)
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [isTerminalVisible, setIsTerminalVisible] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(260)
  const terminalRef = useRef<TerminalHandle>(null)
  const lastTerminalToggleRef = useRef(0)

  // Status bar info
  const [activeLanguage, setActiveLanguage] = useState('')
  const [activeFileName, setActiveFileName] = useState('')
  const [cursorLine, setCursorLine] = useState(1)
  const [cursorColumn, setCursorColumn] = useState(1)
  const [totalLines, setTotalLines] = useState(0)
  const [statusLabel, setStatusLabel] = useState('Ready')
  const [statusVariant, setStatusVariant] = useState<StatusVariant>('success')

  // Toolbar / execution state
  const [mode, setMode] = useState<ToolbarMode>('idle')
  const [stepState, setStepState] = useState<StepState>({
    currentFrame: 0,
    totalFrames: 0,
    isPlaying: false,
  })
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>('python')

  const toggleExplorer = useCallback(() => setIsExplorerVisible((p) => !p), [])
  const toggleEditor = useCallback(() => setIsEditorVisible((p) => !p), [])
  // Terminal toggle is debounced: a single Ctrl+` can reach us twice (once via
  // the window keydown listener, once via Monaco's addCommand dispatch).
  const toggleTerminal = useCallback(() => {
    const now = Date.now()
    if (now - lastTerminalToggleRef.current < 150) return
    lastTerminalToggleRef.current = now
    setIsTerminalVisible((p) => !p)
  }, [])

  // Keyboard shortcuts + menu toggle events.
  useEffect(() => {
    const onToggleTerminal = () => toggleTerminal()
    const onToggleExplorer = () => toggleExplorer()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault()
        toggleExplorer()
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
        e.preventDefault()
        toggleEditor()
      } else if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault()
        toggleTerminal()
      }
    }
    window.addEventListener('algolens:toggle-terminal', onToggleTerminal)
    window.addEventListener('algolens:toggle-explorer', onToggleExplorer)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('algolens:toggle-terminal', onToggleTerminal)
      window.removeEventListener('algolens:toggle-explorer', onToggleExplorer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [toggleTerminal, toggleExplorer, toggleEditor])

  // Cursor position + line count from Monaco.
  useEffect(() => {
    const onCursor = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setCursorLine(detail.line)
      setCursorColumn(detail.column)
    }
    const onLineCount = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setTotalLines(detail.count)
    }
    window.addEventListener('algolens:cursor-position', onCursor)
    window.addEventListener('algolens:line-count', onLineCount)
    return () => {
      window.removeEventListener('algolens:cursor-position', onCursor)
      window.removeEventListener('algolens:line-count', onLineCount)
    }
  }, [])

  // ---- Execution / debug controls -------------------------------------------
  // Toolbar buttons and keyboard shortcuts DISPATCH events; the worker handlers
  // below LISTEN to those events and do the work (no re-dispatch). The future
  // execution backend listens to the same events.

  const runDispatch = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('algolens:run', { detail: { language: currentLanguage } })
    )
  }, [currentLanguage])

  const debugDispatch = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('algolens:debug', {
        detail: { language: currentLanguage },
      })
    )
  }, [currentLanguage])

  const stopDispatch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('algolens:stop'))
  }, [])

  const stepForwardDispatch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('algolens:step-forward'))
  }, [])

  const stepBackDispatch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('algolens:step-back'))
  }, [])

  const playThroughDispatch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('algolens:play-through'))
  }, [])

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang)
    window.dispatchEvent(
      new CustomEvent('algolens:set-language', { detail: { language: lang } })
    )
  }, [])

  // ---- File save / dirty tracking -------------------------------------------

  // Mirror user edits into the active tab and recompute its dirty flag.
  const handleEditorChange = useCallback(
    (value: string) => {
      if (!activeTabId) return
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, content: value, isDirty: value !== t.savedContent }
            : t
        )
      )
    },
    [activeTabId]
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const value = (e as CustomEvent).detail.content as string
      handleEditorChange(value)
    }
    window.addEventListener('algolens:content-changed', handler)
    return () => window.removeEventListener('algolens:content-changed', handler)
  }, [handleEditorChange])

  const saveActiveFile = useCallback(async () => {
    if (!activeTabId) return
    const tab = tabs.find((t) => t.id === activeTabId)
    if (!tab || !tab.handle) return

    try {
      const writable = await tab.handle.createWritable()
      await writable.write(tab.content)
      await writable.close()

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, isDirty: false, savedContent: t.content }
            : t
        )
      )
      terminalRef.current?.addLine('success', `Saved ${tab.name}`)
    } catch (err) {
      terminalRef.current?.addLine(
        'error',
        `Failed to save ${tab.name}: ${err}`
      )
    }
  }, [activeTabId, tabs])

  useEffect(() => {
    const handler = () => saveActiveFile()
    window.addEventListener('algolens:save', handler)
    return () => window.removeEventListener('algolens:save', handler)
  }, [saveActiveFile])

  const doRun = useCallback(() => {
    if (mode === 'running') return
    setMode('running')
    setStatusLabel('Running...')
    setStatusVariant('info')
    setIsTerminalVisible(true)
    terminalRef.current?.clearActive()
    terminalRef.current?.addLine('system', `Running ${currentLanguage} file...`)
    // Temporary simulation until the execution backend exists.
    setTimeout(() => {
      setMode('idle')
      setStatusLabel('Ready')
      setStatusVariant('success')
      terminalRef.current?.addLine(
        'system',
        'Ready for execution backend integration.'
      )
    }, 1500)
  }, [mode, currentLanguage])

  const doDebug = useCallback(() => {
    if (mode === 'debugging') return
    setMode('debugging')
    setStatusLabel('Debugging...')
    setStatusVariant('info')
    setIsTerminalVisible(true)
    terminalRef.current?.clearActive()
    terminalRef.current?.addLine(
      'system',
      `Starting debugger for ${currentLanguage}...`
    )
    terminalRef.current?.addLine('system', 'Execution backend not yet connected.')
    terminalRef.current?.addLine(
      'info',
      'Step controls will activate once trace is captured.'
    )
  }, [mode, currentLanguage])

  const doStop = useCallback(() => {
    setMode('idle')
    setStepState({ currentFrame: 0, totalFrames: 0, isPlaying: false })
    terminalRef.current?.addLine('warning', 'Execution stopped.')
    setStatusLabel('Ready')
    setStatusVariant('success')
  }, [])

  const doStepForward = useCallback(() => {
    if (mode !== 'debugging' && mode !== 'stepping' && mode !== 'paused') return
    setStepState((prev) =>
      prev.currentFrame >= prev.totalFrames
        ? prev
        : { ...prev, currentFrame: prev.currentFrame + 1 }
    )
    setMode('stepping')
  }, [mode])

  const doStepBack = useCallback(() => {
    setStepState((prev) =>
      prev.currentFrame <= 0
        ? prev
        : { ...prev, currentFrame: prev.currentFrame - 1 }
    )
  }, [])

  const doPlayThrough = useCallback(() => {
    setStepState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [])

  // Listen for execution events (from toolbar buttons, keyboard, Monaco).
  useEffect(() => {
    const onRun = () => doRun()
    const onDebug = () => doDebug()
    const onStop = () => doStop()
    const onStepFw = () => doStepForward()
    const onStepBk = () => doStepBack()
    const onPlay = () => doPlayThrough()

    window.addEventListener('algolens:run', onRun)
    window.addEventListener('algolens:debug', onDebug)
    window.addEventListener('algolens:stop', onStop)
    window.addEventListener('algolens:step-forward', onStepFw)
    window.addEventListener('algolens:step-back', onStepBk)
    window.addEventListener('algolens:play-through', onPlay)

    return () => {
      window.removeEventListener('algolens:run', onRun)
      window.removeEventListener('algolens:debug', onDebug)
      window.removeEventListener('algolens:stop', onStop)
      window.removeEventListener('algolens:step-forward', onStepFw)
      window.removeEventListener('algolens:step-back', onStepBk)
      window.removeEventListener('algolens:play-through', onPlay)
    }
  }, [doRun, doDebug, doStop, doStepForward, doStepBack, doPlayThrough])

  // Function-key fallback so F5/F9/etc. work when Monaco does NOT have focus
  // (Monaco's own addCommand handles them while it is focused). Dispatching the
  // same events keeps a single handling path and avoids double-firing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.('.monaco-editor')) return // Monaco will handle it

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('algolens:save'))
        return
      }

      let eventName: string | null = null
      if (e.key === 'F5') eventName = e.shiftKey ? 'algolens:stop' : 'algolens:run'
      else if (e.key === 'F9') eventName = 'algolens:debug'
      else if (e.key === 'F10') eventName = 'algolens:step-forward'
      else if (e.key === 'F11') eventName = 'algolens:step-back'
      else if (e.key === 'F8') eventName = 'algolens:play-through'

      if (eventName) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(eventName))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Relayout Monaco when the surrounding layout changes so it fills the space.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('algolens:relayout'))
  }, [isTerminalVisible, terminalHeight, isExplorerVisible, isEditorVisible, explorerWidth])

  const handleFileSelect = async (file: FileNode) => {
    // Already open — just activate it.
    const existing = tabs.find((t) => t.id === file.id)
    if (existing) {
      setActiveTabId(existing.id)
      setActiveLanguage(existing.language)
      setActiveFileName(existing.name)
      dispatchContent(existing.content)
      dispatchLanguage(existing.language)
      return
    }

    if (!file.handle) return
    const content = await readFileContent(file.handle)

    const newTab: TabItem = {
      id: file.id,
      name: file.name,
      language: getMonacoLanguage(file.language ?? 'unknown'),
      content,
      handle: file.handle,
      isDirty: false,
      savedContent: content,
    }

    // Dedup atomically against the latest state: react-arborist's onSelect can
    // fire more than once per click, and this handler is async, so the stale
    // `tabs` closure above isn't enough to prevent a duplicate tab/key.
    setTabs((prev) =>
      prev.some((t) => t.id === newTab.id) ? prev : [...prev, newTab]
    )
    setActiveTabId(newTab.id)
    setActiveLanguage(newTab.language)
    setActiveFileName(newTab.name)

    dispatchContent(content)
    dispatchLanguage(newTab.language)
  }

  const handleTabClick = (id: string) => {
    const tab = tabs.find((t) => t.id === id)
    if (!tab) return
    setActiveTabId(id)
    setActiveLanguage(tab.language)
    setActiveFileName(tab.name)
    dispatchContent(tab.content)
    dispatchLanguage(tab.language)
  }

  const handleTabClose = (id: string) => {
    const index = tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    const closing = tabs[index]
    if (closing.isDirty) {
      const confirmed = window.confirm(
        `${closing.name} has unsaved changes.\n\nDiscard changes?`
      )
      if (!confirmed) return
    }

    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)

    if (activeTabId === id) {
      if (newTabs.length === 0) {
        setActiveTabId(null)
        setActiveLanguage('')
        setActiveFileName('')
        setCursorLine(1)
        setCursorColumn(1)
        setTotalLines(0)
        dispatchContent('')
        dispatchLanguage('plaintext')
      } else {
        const newIndex = Math.max(0, index - 1)
        const nextTab = newTabs[newIndex]
        setActiveTabId(nextTab.id)
        setActiveLanguage(nextTab.language)
        setActiveFileName(nextTab.name)
        dispatchContent(nextTab.content)
        dispatchLanguage(nextTab.language)
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = explorerWidth

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const newWidth = Math.min(480, Math.max(160, startWidth + delta))
      setExplorerWidth(newWidth)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleTerminalHeightChange = (h: number) => {
    setTerminalHeight(h)
  }

  // Breadcrumb derived from the active tab's id (root/segments/.../file).
  const activeBreadcrumb = useMemo(() => {
    const tab = activeTabId ? tabs.find((t) => t.id === activeTabId) : undefined
    if (!tab) return { rootName: null, filePath: null, fileName: null }

    const parts = tab.id.split('/')
    if (parts.length === 1) {
      return { rootName: null, filePath: null, fileName: tab.name }
    }
    if (parts.length === 2) {
      return { rootName: parts[0], filePath: null, fileName: tab.name }
    }
    return {
      rootName: parts[0],
      filePath: parts.slice(1, -1).join('/'),
      fileName: tab.name,
    }
  }, [activeTabId, tabs])

  const activeTabIsDirty = useMemo(() => {
    if (!activeTabId) return false
    return tabs.find((t) => t.id === activeTabId)?.isDirty ?? false
  }, [activeTabId, tabs])

  // Window title reflects the active file and its dirty state (VS Code style).
  useEffect(() => {
    const tab = activeTabId ? tabs.find((t) => t.id === activeTabId) : undefined
    if (!tab) {
      document.title = 'AlgoLens'
      return
    }
    document.title = `${tab.isDirty ? '● ' : ''}${tab.name} — AlgoLens`
  }, [activeTabId, tabs])

  const hasTabs = tabs.length > 0
  // Keep the editor row occupying space whenever EITHER the explorer or the
  // editor is shown (collapsing it on `!isEditorVisible` alone would also hide
  // the explorer, which shares this row).
  const editorRowFlex = isExplorerVisible || isEditorVisible ? 1 : 0

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
      {/* Menu bar */}
      <div style={{ flexShrink: 0 }}>
        <MenuBar />
      </div>

      {/* Editor toolbar */}
      <EditorToolbar
        mode={mode}
        language={currentLanguage}
        stepState={stepState}
        hasActiveFile={tabs.length > 0}
        breadcrumb={activeBreadcrumb}
        activeTabIsDirty={activeTabIsDirty}
        onLanguageChange={handleLanguageChange}
        onRun={runDispatch}
        onDebug={debugDispatch}
        onStop={stopDispatch}
        onStepForward={stepForwardDispatch}
        onStepBack={stepBackDispatch}
        onPlayThrough={playThroughDispatch}
      />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Editor row */}
        <div
          style={{
            flex: editorRowFlex,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            transition: 'flex 200ms ease',
          }}
        >
          {/* Explorer */}
          <div
            style={{
              width: isExplorerVisible ? explorerWidth : 0,
              flexShrink: 0,
              height: '100%',
              borderRight: isExplorerVisible ? '1px solid #2d2d2d' : 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 200ms ease',
            }}
          >
            <FileExplorer onFileSelect={handleFileSelect} />
          </div>

          {/* Resize handle — only when explorer visible */}
          {isExplorerVisible && (
            <div
              role="separator"
              aria-label="Resize file explorer"
              aria-orientation="vertical"
              onMouseDown={handleResizeMouseDown}
              style={{
                width: 4,
                height: '100%',
                cursor: 'col-resize',
                flexShrink: 0,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = '#094771'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background =
                  'transparent'
              }}
            />
          )}

          {/* Tabs + Monaco (display:none when hidden so Monaco stays mounted) */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: isEditorVisible ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <EditorTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
            />

            {/* Monaco is always mounted (so its event listeners never miss a
                set-content / set-language dispatch). The WelcomeScreen is
                layered on top when no file is open. */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  visibility: hasTabs ? 'visible' : 'hidden',
                }}
              >
                <MonacoEditor />
              </div>
              {!hasTabs && (
                <div style={{ position: 'absolute', inset: 0 }}>
                  <WelcomeScreen />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terminal panel */}
        <Terminal
          ref={terminalRef}
          isVisible={isTerminalVisible}
          height={terminalHeight}
          onHeightChange={handleTerminalHeightChange}
          onClose={() => setIsTerminalVisible(false)}
        />
      </div>

      {/* Status bar — always visible, always last in the column */}
      <StatusBar
        panelState={{
          explorerVisible: isExplorerVisible,
          editorVisible: isEditorVisible,
          terminalVisible: isTerminalVisible,
        }}
        onToggleExplorer={toggleExplorer}
        onToggleEditor={toggleEditor}
        onToggleTerminal={toggleTerminal}
        activeLanguage={activeLanguage}
        activeFile={activeFileName}
        lineNumber={cursorLine}
        columnNumber={cursorColumn}
        totalLines={totalLines}
        statusLabel={statusLabel}
        statusVariant={statusVariant}
      />
    </div>
  )
}
