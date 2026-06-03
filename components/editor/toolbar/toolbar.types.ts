export type ToolbarMode =
  | 'idle'
  | 'running'
  | 'debugging'
  | 'stepping'
  | 'paused'
  | 'finished'
  | 'error'

export type SupportedLanguage =
  | 'python'
  | 'javascript'
  | 'cpp'
  | 'c'
  | 'java'

export interface StepState {
  currentFrame: number
  totalFrames: number
  isPlaying: boolean
}

export interface ToolbarState {
  mode: ToolbarMode
  language: SupportedLanguage
  stepState: StepState
  hasActiveFile: boolean
}
