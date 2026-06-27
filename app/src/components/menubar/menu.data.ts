import { useLayoutStore } from '@/stores/layout.store'
import { executionConfig } from '@/components/tabs/tab.data'
import { sendWindowCommand } from './menu.cef'
import {
  newFile,
  openFile,
  openFolder,
  save,
  saveAs,
  saveAll,
  closeActiveTab,
} from './file.actions'
import { editActions, selectionActions } from './edit.actions'
import {
  openExternal,
  REPORT_BUG_URL,
  FEATURE_REQUEST_URL,
  DOCS_URL,
  GITHUB_REPO,
} from './external'

export type MenubarItemConfig =
  | { type: 'item'; label: string; shortcut?: string; action?: () => void }
  | { type: 'separator' }

export interface MenuConfig {
  trigger: string
  items: MenubarItemConfig[]
}

function execute(id: 'run' | 'debug') {
  executionConfig.find((c) => c.id === id)?.action?.()
}

export const menuConfig: MenuConfig[] = [
  {
    trigger: 'File',
    items: [
      { type: 'item', label: 'New File', shortcut: 'Ctrl+N', action: newFile },
      { type: 'item', label: 'Open File…', shortcut: 'Ctrl+O', action: openFile },
      { type: 'item', label: 'Open Folder…', shortcut: 'Ctrl+K Ctrl+O', action: openFolder },
      { type: 'separator' },
      { type: 'item', label: 'Save', shortcut: 'Ctrl+S', action: save },
      { type: 'item', label: 'Save As…', shortcut: 'Ctrl+Shift+S', action: saveAs },
      { type: 'item', label: 'Save All', shortcut: 'Ctrl+K S', action: saveAll },
      { type: 'separator' },
      { type: 'item', label: 'Close Editor', shortcut: 'Ctrl+W', action: closeActiveTab },
      { type: 'separator' },
      { type: 'item', label: 'Exit', shortcut: 'Ctrl+Q', action: () => sendWindowCommand('closeWindow') },
    ],
  },
  {
    trigger: 'Edit',
    items: [
      { type: 'item', label: 'Undo', shortcut: 'Ctrl+Z', action: editActions.undo },
      { type: 'item', label: 'Redo', shortcut: 'Ctrl+Y', action: editActions.redo },
      { type: 'separator' },
      { type: 'item', label: 'Cut', shortcut: 'Ctrl+X', action: editActions.cut },
      { type: 'item', label: 'Copy', shortcut: 'Ctrl+C', action: editActions.copy },
      { type: 'item', label: 'Paste', shortcut: 'Ctrl+V', action: editActions.paste },
      { type: 'separator' },
      { type: 'item', label: 'Find', shortcut: 'Ctrl+F', action: editActions.find },
      { type: 'item', label: 'Replace', shortcut: 'Ctrl+H', action: editActions.replace },
    ],
  },
  {
    trigger: 'Selection',
    items: [
      { type: 'item', label: 'Select All', shortcut: 'Ctrl+A', action: selectionActions.selectAll },
      { type: 'item', label: 'Expand Selection', shortcut: 'Shift+Alt+→', action: selectionActions.expand },
      { type: 'item', label: 'Shrink Selection', shortcut: 'Shift+Alt+←', action: selectionActions.shrink },
      { type: 'separator' },
      { type: 'item', label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', action: selectionActions.copyLineUp },
      { type: 'item', label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', action: selectionActions.copyLineDown },
    ],
  },
  {
    trigger: 'View',
    items: [
      { type: 'item', label: 'Command Palette…', shortcut: 'Ctrl+Shift+P' },
      { type: 'separator' },
      { type: 'item', label: 'Zoom In', shortcut: 'Ctrl+=' },
      { type: 'item', label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { type: 'item', label: 'Reset Zoom', shortcut: 'Ctrl+0' },
      { type: 'separator' },
      { type: 'item', label: 'Project Panel', action: () => useLayoutStore().toggleExplorer() },
      { type: 'item', label: 'Terminal Panel', action: () => useLayoutStore().toggleTerminal() },
      { type: 'item', label: 'Visualizer Panel', action: () => useLayoutStore().toggleVisualizer() },
    ],
  },
  {
    trigger: 'Run',
    items: [
      { type: 'item', label: 'Run Program', shortcut: 'F5', action: () => execute('run') },
      { type: 'item', label: 'Debug Program', shortcut: 'F9', action: () => execute('debug') },
    ],
  },
  {
    trigger: 'Help',
    items: [
      { type: 'item', label: 'Documentation', action: () => openExternal(DOCS_URL) },
      { type: 'separator' },
      { type: 'item', label: 'Report Bug…', action: () => openExternal(REPORT_BUG_URL) },
      { type: 'item', label: 'Request Feature…', action: () => openExternal(FEATURE_REQUEST_URL) },
      { type: 'separator' },
      { type: 'item', label: 'About AlgoLens', action: () => openExternal(GITHUB_REPO) },
    ],
  },
]
