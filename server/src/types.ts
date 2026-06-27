// ── Messages FROM frontend TO server ────────────────────────────────────────

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

export interface ComplexityRequest {
  type: 'complexity'
  id: string
  language: Language
  code: string
  inputSizes: number[] // e.g. [10, 50, 100, 500, 1000]
}

export type ClientMessage =
  | RunRequest
  | DebugRequest
  | StopRequest
  | ComplexityRequest

// ── Messages FROM server TO frontend ────────────────────────────────────────

export interface OutputLine {
  type: 'output'
  id: string
  stream: 'stdout' | 'stderr'
  text: string
  timestamp: number
}

export interface TraceFrame {
  type: 'frame'
  id: string
  frameIndex: number
  lineNumber: number
  variables: Record<string, TraceVariable>
  stepType: StepType
  callStack: CallFrame[]
  sourceCode: string
}

export interface TraceVariable {
  name: string
  value: string
  type: string
  changed: boolean
}

export interface CallFrame {
  functionName: string
  lineNumber: number
  filename: string
}

export interface ExecutionComplete {
  type: 'complete'
  id: string
  exitCode: number
  totalFrames?: number
  durationMs: number
}

export interface ExecutionError {
  type: 'error'
  id: string
  message: string
  errorType: 'timeout' | 'memory' | 'compile' | 'runtime' | 'unsupported'
}

export interface ServerReady {
  type: 'ready'
  version: string
}

export interface RuntimeStatus {
  type: 'runtime-status'
  available: {
    python: boolean
    javascript: boolean
    cpp: boolean
    c: boolean
    java: boolean
  }
}

export interface ComplexityResult {
  type: 'complexity-result'
  id: string
  measurements: Array<{
    n: number
    operations: number // total trace frames captured for this input size
    timeMs: number
  }>
}

export interface ComplexityProgress {
  type: 'complexity-progress'
  id: string
  n: number
  index: number
  total: number
}

export type ServerMessage =
  | OutputLine
  | TraceFrame
  | ExecutionComplete
  | ExecutionError
  | ServerReady
  | RuntimeStatus
  | ComplexityResult
  | ComplexityProgress

export type Language = 'python' | 'javascript' | 'cpp' | 'c' | 'java'

export type StepType =
  | 'call'
  | 'return'
  | 'line'
  | 'compare'
  | 'swap'
  | 'assign'
  | 'loop'
