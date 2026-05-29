'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import MenuBar from './menubar/MenuBar'
import MonacoEditor from './monaco/MonacoEditor'
import FileExplorer from './explorer/FileExplorer'
import EditorTabs from './tabs/EditorTabs'
import Terminal from './terminal/Terminal'
import type { TerminalHandle } from './terminal/Terminal'
import StatusBar from './statusbar/StatusBar'
import type { FileNode } from './explorer/explorer.types'
import type { TabItem } from './tabs/tabs.types'
import { readFileContent, getMonacoLanguage } from './explorer/filesystemUtils'

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
      />
    </div>
  )
}
