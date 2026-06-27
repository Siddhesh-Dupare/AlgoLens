import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLayoutStore } from './layout.store'

export type TerminalSession = {
  id: string
  name: string
  shell: string // shell id, e.g. 'powershell' | 'gitbash'
}

export type ShellInfo = { id: string; label: string }

export const useTerminalStore = defineStore('terminal', () => {
  const sessions = ref<TerminalSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const availableShells = ref<ShellInfo[]>([])

  // Ask the terminal server which shells exist on this machine (PowerShell,
  // Git Bash, …). Uses a short-lived socket that never spawns a pty.
  function fetchShells(): Promise<void> {
    return new Promise((resolve) => {
      let ws: WebSocket
      try {
        ws = new WebSocket('ws://127.0.0.1:3002')
      } catch {
        return resolve()
      }
      ws.onopen = () => ws.send(JSON.stringify({ type: 'listShells' }))
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(typeof e.data === 'string' ? e.data : '')
          if (msg.type === 'shells') availableShells.value = msg.shells
        } catch {
          // ignore
        }
        ws.close()
        resolve()
      }
      ws.onerror = () => resolve()
    })
  }

  function createSession(shellId?: string, label?: string) {
    const fallback = availableShells.value[0]
    const shell = shellId ?? fallback?.id ?? 'powershell'
    const name = label ?? fallback?.label ?? 'Terminal'
    const id = crypto.randomUUID()
    sessions.value.push({ id, name, shell })
    activeSessionId.value = id
  }

  function closeSession(id: string) {
    const index = sessions.value.findIndex((s) => s.id === id)
    if (index === -1) return
    sessions.value.splice(index, 1)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[index]?.id ?? sessions.value[index - 1]?.id ?? null
    }
    // Closing the last terminal hides the panel automatically.
    if (sessions.value.length === 0) {
      useLayoutStore().terminalVisible = false
    }
  }

  function setActiveSession(id: string) {
    activeSessionId.value = id
  }

  return {
    sessions,
    activeSessionId,
    availableShells,
    fetchShells,
    createSession,
    closeSession,
    setActiveSession,
  }
})
