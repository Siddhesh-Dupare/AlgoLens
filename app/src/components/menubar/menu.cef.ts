import { Minus, Square, X } from '@lucide/vue'
import type { Component } from 'vue'
import { notifyError } from '@/lib/notify'

export type WindowControl = {
  id: string
  label: string
  symbol: Component
  method: string
  color: string
}

export function sendWindowCommand(method: string) {
  if (window.cefQuery) {
    window.cefQuery({
      request: JSON.stringify({ type: method }),
      onSuccess: () => {},
      onFailure: (code, msg) => {
        console.error('cefQuery failed', code, msg)
        notifyError('Window command failed', msg, 'cefquery-window')
      },
    })
  } else {
    console.warn('Not running inside algolens -cef query unavailable')
  }
}

export const windowConfig: WindowControl[] = [
  {
    id: 'min',
    label: 'Minimize',
    symbol: Minus,
    method: 'minimizeWindow',
    color: 'hover:bg-gray-500',
  },
  {
    id: 'max',
    label: 'Maximize',
    symbol: Square,
    method: 'maximizeWindow',
    color: 'hover:bg-gray-500',
  },
  {
    id: 'close',
    label: 'Close',
    symbol: X,
    method: 'closeWindow',
    color: 'hover:bg-red-500',
  },
]
