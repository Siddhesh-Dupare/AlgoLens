'use client'

import type {
  ServerMessage,
  RunRequest,
  DebugRequest,
  Language,
  TraceFrame,
  OutputLine,
  ExecutionComplete,
  ExecutionError,
} from './executionTypes'

const SERVER_URL = 'ws://localhost:3001'
const RECONNECT_DELAY_MS = 2000

export interface ExecutionCallbacks {
  onOutput: (line: OutputLine) => void
  onFrame: (frame: TraceFrame) => void
  onComplete: (result: ExecutionComplete) => void
  onError: (err: ExecutionError) => void
  onReady: () => void
}

class ExecutionClient {
  private ws: WebSocket | null = null
  private connected = false
  private callbacks: Partial<ExecutionCallbacks> = {}
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private currentRequestId: string | null = null

  connect(): void {
    if (this.connected || this.ws) return

    let socket: WebSocket
    try {
      socket = new WebSocket(SERVER_URL)
    } catch {
      this.scheduleReconnect()
      return
    }
    this.ws = socket

    socket.onopen = () => {
      this.connected = true
      console.log('[ExecutionClient] Connected to server')
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    socket.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)
        this.handleMessage(msg)
      } catch {
        console.error('[ExecutionClient] Failed to parse message')
      }
    }

    socket.onclose = () => {
      this.connected = false
      this.ws = null
      this.scheduleReconnect()
    }

    socket.onerror = () => {
      // onclose will follow and trigger reconnect.
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, RECONNECT_DELAY_MS)
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'ready':
        this.callbacks.onReady?.()
        break
      case 'output':
        this.callbacks.onOutput?.(msg)
        break
      case 'frame':
        this.callbacks.onFrame?.(msg)
        break
      case 'complete':
        this.callbacks.onComplete?.(msg)
        break
      case 'error':
        this.callbacks.onError?.(msg)
        break
    }
  }

  setCallbacks(cb: Partial<ExecutionCallbacks>): void {
    this.callbacks = cb
  }

  run(language: Language, code: string, filename: string): string | null {
    if (!this.connected || !this.ws) {
      console.warn('[ExecutionClient] Server not connected')
      return null
    }
    const id = crypto.randomUUID()
    this.currentRequestId = id
    const msg: RunRequest = { type: 'run', id, language, code, filename }
    this.ws.send(JSON.stringify(msg))
    return id
  }

  debug(language: Language, code: string, filename: string): string | null {
    if (!this.connected || !this.ws) {
      console.warn('[ExecutionClient] Server not connected')
      return null
    }
    const id = crypto.randomUUID()
    this.currentRequestId = id
    const msg: DebugRequest = { type: 'debug', id, language, code, filename }
    this.ws.send(JSON.stringify(msg))
    return id
  }

  stop(): void {
    if (!this.connected || !this.ws || !this.currentRequestId) return
    this.ws.send(
      JSON.stringify({ type: 'stop' as const, id: this.currentRequestId })
    )
    this.currentRequestId = null
  }

  isConnected(): boolean {
    return this.connected
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
    this.connected = false
  }
}

export const executionClient = new ExecutionClient()
