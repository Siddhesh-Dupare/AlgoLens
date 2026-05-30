'use client'

import {
  PanelLeft,
  PanelBottom,
  Code2,
  CheckCircle2,
  FileCode,
  Bug,
  Square,
  ChevronRight,
} from 'lucide-react'
import type { ReactNode } from 'react'
import StatusBarItem from './StatusBarItem'
import StatusBarToggle from './StatusBarToggle'
import type { StatusBarItemData, PanelToggleState } from './statusbar.types'

type StatusVariant = 'default' | 'info' | 'success' | 'warning' | 'error'

interface StatusBarProps {
  panelState: PanelToggleState
  onToggleExplorer: () => void
  onToggleEditor: () => void
  onToggleTerminal: () => void
  activeLanguage?: string
  activeFile?: string
  lineNumber?: number
  columnNumber?: number
  totalLines?: number
  statusLabel?: string
  statusVariant?: StatusVariant
}

function StatusSpinner() {
  return (
    <span
      style={{
        width: 11,
        height: 11,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

function getStatusIcon(label: string): ReactNode {
  switch (label) {
    case 'Running...':
      return <StatusSpinner />
    case 'Debugging...':
      return <Bug size={12} color="#75beff" />
    case 'Stepping':
      return <ChevronRight size={12} color="#a1a1aa" />
    case 'Stopped':
      return <Square size={12} color="#f48771" />
    case 'Ready':
    default:
      return <CheckCircle2 size={12} color="#89d185" />
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  markdown: 'Markdown',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  plaintext: 'Plain Text',
  unknown: 'Plain Text',
}

const LANGUAGE_COLORS: Record<string, string> = {
  python: '#3b8eea',
  javascript: '#f1c40f',
  typescript: '#3b8eea',
  cpp: '#9b59b6',
  c: '#8e44ad',
  java: '#e74c3c',
  markdown: '#4ecdc4',
  json: '#f39c12',
}

function LanguageDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

export default function StatusBar({
  panelState,
  onToggleExplorer,
  onToggleEditor,
  onToggleTerminal,
  activeLanguage,
  activeFile,
  lineNumber,
  columnNumber,
  totalLines,
  statusLabel = 'Ready',
  statusVariant = 'success',
}: StatusBarProps) {
  const leftItems: StatusBarItemData[] = []

  // 1. Status indicator (Ready / Running... / Debugging... / Stopped)
  leftItems.push({
    id: 'status',
    label: statusLabel,
    icon: getStatusIcon(statusLabel),
    variant: statusVariant,
  })

  // 2. Language indicator
  if (activeLanguage && activeLanguage !== 'unknown') {
    const displayName = LANGUAGE_NAMES[activeLanguage] ?? activeLanguage
    const dotColor = LANGUAGE_COLORS[activeLanguage] ?? '#7f8c8d'
    leftItems.push({
      id: 'language',
      label: displayName,
      icon: <LanguageDot color={dotColor} />,
      variant: 'info',
    })
  } else {
    leftItems.push({
      id: 'language',
      label: 'Plain Text',
      variant: 'default',
    })
  }

  // 3. File info
  if (activeFile) {
    leftItems.push({
      id: 'file',
      label: activeFile,
      icon: <FileCode size={12} />,
      variant: 'default',
    })
  }

  // 4. Cursor position
  if (lineNumber !== undefined && columnNumber !== undefined && activeFile) {
    leftItems.push({
      id: 'cursor',
      label: `Ln ${lineNumber}, Col ${columnNumber}`,
      variant: 'default',
    })
  }

  // 5. Total lines
  if (totalLines !== undefined && activeFile) {
    leftItems.push({
      id: 'total-lines',
      label: `${totalLines} lines`,
      variant: 'default',
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '28px',
        background: '#1a1a1a',
        borderTop: '1px solid #2d2d2d',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Left section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          gap: '2px',
          padding: '0 4px',
        }}
      >
        {leftItems.map((item) => (
          <StatusBarItem key={item.id} item={item} />
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '16px',
          background: '#3c3c3c',
          flexShrink: 0,
        }}
      />

      {/* Right section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          flexShrink: 0,
          padding: '0 4px',
        }}
      >
        <StatusBarToggle
          label="Explorer"
          icon={<PanelLeft size={14} />}
          isActive={panelState.explorerVisible}
          onClick={onToggleExplorer}
          tooltip="Toggle Explorer"
          shortcut="Ctrl+Shift+E"
        />
        <StatusBarToggle
          label="Editor"
          icon={<Code2 size={14} />}
          isActive={panelState.editorVisible}
          onClick={onToggleEditor}
          tooltip="Toggle Editor"
          shortcut="Ctrl+Shift+X"
        />
        <StatusBarToggle
          label="Terminal"
          icon={<PanelBottom size={14} />}
          isActive={panelState.terminalVisible}
          onClick={onToggleTerminal}
          tooltip="Toggle Terminal"
          shortcut="Ctrl+`"
        />
      </div>
    </div>
  )
}
