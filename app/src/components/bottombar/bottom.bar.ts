import { ListTree, UsersRound, SquareTerminal, Box, Astroid } from '@lucide/vue'
import type { Component } from 'vue'
import { useLayoutStore } from '@/stores/layout.store'

export type BarStripControl = {
  id: string
  label: string
  symbol: Component
  action?: () => void
}

export const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  plaintext: 'Plain Text',
}

export const stripLeftConfig: BarStripControl[] = [
  {
    id: 'tree-list',
    label: 'Explorer',
    symbol: ListTree,
    action: () => useLayoutStore().toggleExplorer(),
  },
  {
    id: 'users-collab',
    label: 'Collab',
    symbol: UsersRound,
  },
]

export const stripRightConfig: BarStripControl[] = [
  {
    id: 'terminal-panel',
    label: 'Terminal',
    symbol: SquareTerminal,
    action: () => useLayoutStore().toggleTerminal(),
  },
  {
    id: 'visualizer-panel',
    label: 'Visualizer',
    symbol: Box,
    action: () => useLayoutStore().toggleVisualizer(),
  },
  {
    id: 'agent-panel',
    label: 'Agent',
    symbol: Astroid,
  },
]
