export type TerminalLineType =
  | 'command'
  | 'output'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'system'

export interface TerminalLineData {
  id: string
  type: TerminalLineType
  text: string
  timestamp: Date
}

export type ShellType =
  | 'bash'
  | 'zsh'
  | 'powershell'
  | 'cmd'
  | 'python'
  | 'node'

export interface TerminalInstance {
  id: string
  title: string
  lines: TerminalLineData[]
  isActive: boolean
  shellType: ShellType
}

export interface TerminalState {
  instances: TerminalInstance[]
  activeInstanceId: string | null
  height: number
  isVisible: boolean
}
