import type {
  TerminalLineData,
  TerminalLineType,
  TerminalInstance,
  ShellType,
} from './terminal.types'

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function createTerminalLine(
  type: TerminalLineType,
  text: string
): TerminalLineData {
  return {
    id: generateId(),
    type,
    text,
    timestamp: new Date(),
  }
}

export function createTerminalInstance(
  title?: string,
  shellType?: ShellType
): TerminalInstance {
  return {
    id: generateId(),
    title: title ?? 'bash',
    lines: [],
    isActive: true,
    shellType: shellType ?? 'bash',
  }
}

export function getLinePrefix(type: TerminalLineType): string {
  switch (type) {
    case 'command':
      return '$'
    case 'output':
      return ''
    case 'error':
      return ''
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    case 'success':
      return '✓'
    case 'system':
      return '>'
    default:
      return ''
  }
}

export function getLineColor(type: TerminalLineType): string {
  switch (type) {
    case 'command':
      return '#cccccc'
    case 'output':
      return '#d4d4d4'
    case 'error':
      return '#f48771'
    case 'warning':
      return '#cca700'
    case 'info':
      return '#75beff'
    case 'success':
      return '#89d185'
    case 'system':
      return '#4ec9b0'
    default:
      return '#d4d4d4'
  }
}

export function getPrefixColor(type: TerminalLineType): string {
  switch (type) {
    case 'command':
      return '#569cd6'
    case 'output':
      return '#d4d4d4'
    case 'error':
      return '#f48771'
    case 'warning':
      return '#cca700'
    case 'info':
      return '#75beff'
    case 'success':
      return '#89d185'
    case 'system':
      return '#4ec9b0'
    default:
      return '#d4d4d4'
  }
}

export function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function detectShellType(): ShellType {
  if (typeof navigator !== 'undefined' && navigator.platform.includes('Win')) {
    return 'powershell'
  }
  return 'bash'
}
