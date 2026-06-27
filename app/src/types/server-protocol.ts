export type Language = 'python' | 'javascript' | 'cpp' | 'c' | 'java'

export interface RunRequest {
  type: 'run'
  id: string
  language: Language
  code: string
  filename: string
}
export interface DebugRequest {
  type: 'debug'
  id: string
  language: Language
  code: string
  filename: string
}
export interface StopRequest {
  type: 'stop'
  id: string
}

export type ClientMessage = RunRequest | DebugRequest | StopRequest

export interface OutputLine {
  type: 'output'
  id: string
  stream: 'stdout' | 'stderr'
  text: string
  timestamp: number
}
export interface ExecutionComplete {
  type: 'complete'
  id: string
  exitCode: number
  durationMs: number
}
export interface ExecutionError {
  type: 'error'
  id: string
  message: string
  errorType: string
}
export interface ServerReady {
  type: 'ready'
  version: string
}

export interface TraceVariable {
  name: string
  value: string
  type: string
  changed: boolean
  // 'local' = lives in the current frame (main stage); 'outer' = surfaced from an
  // enclosing scope/global (parked as a thumbnail). Absent on older payloads.
  scope?: 'local' | 'outer'
}

export interface CallFrame {
  functionName: string
  lineNumber: number
  filename: string
}

export interface TraceFrame {
  type: 'frame'
  id: string
  frameIndex: number
  lineNumber: number
  variables: Record<string, TraceVariable>
  stepType: string
  callStack: CallFrame[]
  sourceCode: string
}

export type ServerMessage =
  | OutputLine
  | TraceFrame
  | ExecutionComplete
  | ExecutionError
  | ServerReady
