import type { ReactNode } from 'react'

export interface StatusBarItemData {
  id: string
  label: string
  value?: string
  icon?: ReactNode
  onClick?: () => void
  tooltip?: string
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export interface PanelToggleState {
  explorerVisible: boolean
  editorVisible: boolean
  terminalVisible: boolean
}

export function getLanguageDotColor(language: string): string {
  const map: Record<string, string> = {
    python: '#3b8eea',
    javascript: '#f1c40f',
    typescript: '#3b8eea',
    cpp: '#9b59b6',
    c: '#8e44ad',
    java: '#e74c3c',
    markdown: '#4ecdc4',
    json: '#f39c12',
    html: '#e67e22',
    css: '#2980b9',
    plaintext: '#7f8c8d',
    unknown: '#7f8c8d',
  }
  return map[language] ?? '#7f8c8d'
}
