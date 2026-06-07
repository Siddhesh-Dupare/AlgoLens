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
  RuntimeStatus,
  ComplexityRequest,
  ComplexityResult,
  ComplexityProgress,
} from './executionTypes'

export interface ComplexityHandlers {
  onProgress?: (p: ComplexityProgress) => void
  onResult?: (r: ComplexityResult) => void
  onError?: (e: ExecutionError) => void
}

interface TraceCollector {
  frames: TraceFrame[]
  resolve: (frames: TraceFrame[]) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const SERVER_URL = 'ws://localhost:3001'
const RECONNECT_DELAY_MS = 2000

export interface ExecutionCallbacks {
  onOutput: (line: OutputLine) => void
  onFrame: (frame: TraceFrame) => void
  onComplete: (result: ExecutionComplete) => void
  onError: (err: ExecutionError) => void
  onReady: () => void
  onRuntimeStatus: (status: RuntimeStatus['available']) => void
}

class ExecutionClient {
  private ws: WebSocket | null = null
  private connected = false
  private callbacks: Partial<ExecutionCallbacks> = {}
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private currentRequestId: string | null = null
  // Complexity runs use per-request handlers so they don't clobber the global
  // run/debug callbacks set by the editor.
  private complexityHandlers = new Map<string, ComplexityHandlers>()
  // One-shot debug runs (used by the classifier benchmark) collect frames by id
  // and resolve a promise on completion, also without touching global callbacks.
  private traceCollectors = new Map<string, TraceCollector>()
  // One-shot plain runs (used by the performance report) just resolve on
  // completion; their output is discarded so the editor terminal isn't touched.
  private runCollectors = new Map<
    string,
    { resolve: () => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
  >()

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
      case 'output': {
        if (this.runCollectors.has(msg.id)) break // discard one-shot run output
        this.callbacks.onOutput?.(msg)
        break
      }
      case 'frame': {
        const tc = this.traceCollectors.get(msg.id)
        if (tc) tc.frames.push(msg)
        else this.callbacks.onFrame?.(msg)
        break
      }
      case 'complete': {
        const tc = this.traceCollectors.get(msg.id)
        const rc = this.runCollectors.get(msg.id)
        if (tc) {
          clearTimeout(tc.timer)
          this.traceCollectors.delete(msg.id)
          tc.resolve(tc.frames)
        } else if (rc) {
          clearTimeout(rc.timer)
          this.runCollectors.delete(msg.id)
          rc.resolve()
        } else {
          this.callbacks.onComplete?.(msg)
        }
        break
      }
      case 'error':
        // Route errors to whichever one-shot handler owns the id; else the editor.
        if (this.complexityHandlers.has(msg.id)) {
          this.complexityHandlers.get(msg.id)?.onError?.(msg)
          this.complexityHandlers.delete(msg.id)
        } else if (this.traceCollectors.has(msg.id)) {
          const tc = this.traceCollectors.get(msg.id)!
          clearTimeout(tc.timer)
          this.traceCollectors.delete(msg.id)
          tc.reject(new Error(msg.message))
        } else if (this.runCollectors.has(msg.id)) {
          const rc = this.runCollectors.get(msg.id)!
          clearTimeout(rc.timer)
          this.runCollectors.delete(msg.id)
          rc.reject(new Error(msg.message))
        } else {
          this.callbacks.onError?.(msg)
        }
        break
      case 'runtime-status':
        this.callbacks.onRuntimeStatus?.(msg.available)
        break
      case 'complexity-progress':
        this.complexityHandlers.get(msg.id)?.onProgress?.(msg)
        break
      case 'complexity-result':
        this.complexityHandlers.get(msg.id)?.onResult?.(msg)
        this.complexityHandlers.delete(msg.id)
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

  runComplexity(
    language: Language,
    code: string,
    inputSizes: number[],
    handlers: ComplexityHandlers
  ): string | null {
    if (!this.connected || !this.ws) {
      console.warn('[ExecutionClient] Server not connected')
      return null
    }
    const id = crypto.randomUUID()
    this.complexityHandlers.set(id, handlers)
    const msg: ComplexityRequest = {
      type: 'complexity',
      id,
      language,
      code,
      inputSizes,
    }
    this.ws.send(JSON.stringify(msg))
    return id
  }

  // One-shot debug that resolves with the captured trace frames. Used by the
  // classifier benchmark to exercise the full (Tier 1 + 2 + 3) pipeline without
  // disturbing the editor's live debug callbacks.
  traceOnce(
    language: Language,
    code: string,
    filename: string,
    timeoutMs = 15000
  ): Promise<TraceFrame[]> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('Execution server not connected'))
        return
      }
      const id = crypto.randomUUID()
      const timer = setTimeout(() => {
        this.traceCollectors.delete(id)
        reject(new Error('Trace timed out'))
      }, timeoutMs)
      this.traceCollectors.set(id, { frames: [], resolve, reject, timer })
      const msg: DebugRequest = { type: 'debug', id, language, code, filename }
      this.ws.send(JSON.stringify(msg))
    })
  }

  // One-shot run (no trace) that resolves on completion. Used by the
  // performance report to time plain execution vs. traced execution.
  runOnce(
    language: Language,
    code: string,
    filename: string,
    timeoutMs = 15000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('Execution server not connected'))
        return
      }
      const id = crypto.randomUUID()
      const timer = setTimeout(() => {
        this.runCollectors.delete(id)
        reject(new Error('Run timed out'))
      }, timeoutMs)
      this.runCollectors.set(id, { resolve, reject, timer })
      const msg: RunRequest = { type: 'run', id, language, code, filename }
      this.ws.send(JSON.stringify(msg))
    })
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
