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
