'use client'

import { useState } from 'react'
import MenuBar from './menubar/MenuBar'
import MonacoEditor from './monaco/MonacoEditor'
import FileExplorer from './explorer/FileExplorer'
import EditorTabs from './tabs/EditorTabs'
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

  const handleFileSelect = async (file: FileNode) => {
    // Already open — just activate it.
    const existing = tabs.find((t) => t.id === file.id)
    if (existing) {
      setActiveTabId(existing.id)
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

    dispatchContent(content)
    dispatchLanguage(newTab.language)
  }

  const handleTabClick = (id: string) => {
    const tab = tabs.find((t) => t.id === id)
    if (!tab) return
    setActiveTabId(id)
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
        dispatchContent('')
        dispatchLanguage('plaintext')
      } else {
        const newIndex = Math.max(0, index - 1)
        const nextTab = newTabs[newIndex]
        setActiveTabId(nextTab.id)
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

  const hasTabs = tabs.length > 0

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
      <div style={{ flexShrink: 0 }}>
        <MenuBar />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* Column A: File explorer */}
        <div
          style={{
            width: explorerWidth,
            flexShrink: 0,
            height: '100%',
            borderRight: '1px solid #2d2d2d',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FileExplorer onFileSelect={handleFileSelect} />
        </div>

        {/* Resize handle */}
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
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => {
            ;(e.target as HTMLDivElement).style.background = '#094771'
          }}
          onMouseLeave={(e) => {
            ;(e.target as HTMLDivElement).style.background = 'transparent'
          }}
        />

        {/* Column B: Tabs + Monaco */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
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
              set-content / set-language dispatch). The WelcomeScreen is layered
              on top when no file is open. */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
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
    </div>
  )
}
