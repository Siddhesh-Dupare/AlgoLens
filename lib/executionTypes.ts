// Frontend mirror of algolens-server/src/types.ts — keep these identical.

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

export type ServerMessage =
  | OutputLine
  | TraceFrame
  | ExecutionComplete
  | ExecutionError
  | ServerReady
  | RuntimeStatus

export type Language = 'python' | 'javascript' | 'cpp' | 'c' | 'java'

export type StepType =
  | 'call'
  | 'return'
  | 'line'
  | 'compare'
  | 'swap'
  | 'assign'
  | 'loop'
