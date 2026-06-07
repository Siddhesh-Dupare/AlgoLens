import { create } from 'zustand'
import { useClassifierStore } from './useClassifierStore'
import { hasAIKey } from '@/lib/ai/client'

// Track A — local-only usage telemetry for the user study. Nothing is sent
// anywhere; data is exported as a JSON file the researcher collects manually.
// Every record* method is a no-op unless study mode is active, so it adds zero
// overhead and zero behavior change to normal use.

export interface StudySession {
  sessionId: string
  participantId: string
  taskId: string
  startTime: number
  endTime: number | null
  language: string
  algorithmDetected: string
  detectionTier: number
  confidence: number
  totalFrames: number
  stepsForward: number
  stepsBack: number
  timeToFirstStep: number
  timeToAnswer: number
  qaQueriesCount: number
  complexityRan: boolean
  complexityCorrect: boolean | null
  errorsMade: number
  clarityRating: number
  narrationEnabled: boolean
  apiKeyPresent: boolean
}

export interface TelemetryStore {
  isStudyMode: boolean
  isControlMode: boolean
  participantId: string
  currentTaskId: string
  currentSession: StudySession | null
  completedSessions: StudySession[]

  enableStudyMode: (participantId: string) => void
  enableControlMode: (participantId: string) => void
  disableStudyMode: () => void
  startTask: (taskId: string) => void
  recordStepForward: () => void
  recordStepBack: () => void
  recordQAQuery: () => void
  recordComplexityRun: (correct: boolean | null) => void
  markUnderstood: () => void
  recordClarityRating: (rating: number) => void
  recordError: () => void
  endTask: () => void
  exportData: () => void
  clearData: () => void
}

function newSession(participantId: string, taskId: string): StudySession {
  return {
    sessionId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    participantId,
    taskId,
    startTime: Date.now(),
    endTime: null,
    language: '',
    algorithmDetected: '',
    detectionTier: 0,
    confidence: 0,
    totalFrames: 0,
    stepsForward: 0,
    stepsBack: 0,
    timeToFirstStep: 0,
    timeToAnswer: 0,
    qaQueriesCount: 0,
    complexityRan: false,
    complexityCorrect: null,
    errorsMade: 0,
    clarityRating: 0,
    narrationEnabled: hasAIKey(),
    apiKeyPresent: hasAIKey(),
  }
}

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  isStudyMode: false,
  isControlMode: false,
  participantId: '',
  currentTaskId: '',
  currentSession: null,
  completedSessions: [],

  enableStudyMode: (participantId) =>
    set({ isStudyMode: true, isControlMode: false, participantId }),
  enableControlMode: (participantId) =>
    set({ isStudyMode: true, isControlMode: true, participantId }),
  disableStudyMode: () =>
    set({ isStudyMode: false, isControlMode: false, currentSession: null }),

  startTask: (taskId) => {
    const { isStudyMode, participantId } = get()
    if (!isStudyMode) return
    set({ currentTaskId: taskId, currentSession: newSession(participantId, taskId) })
  },

  recordStepForward: () => {
    const s = get().currentSession
    if (!s) return
    const timeToFirstStep =
      s.stepsForward === 0 && s.timeToFirstStep === 0
        ? Date.now() - s.startTime
        : s.timeToFirstStep
    set({
      currentSession: {
        ...s,
        stepsForward: s.stepsForward + 1,
        timeToFirstStep,
      },
    })
  },

  recordStepBack: () => {
    const s = get().currentSession
    if (!s) return
    set({ currentSession: { ...s, stepsBack: s.stepsBack + 1 } })
  },

  recordQAQuery: () => {
    const s = get().currentSession
    if (!s) return
    set({ currentSession: { ...s, qaQueriesCount: s.qaQueriesCount + 1 } })
  },

  recordComplexityRun: (correct) => {
    const s = get().currentSession
    if (!s) return
    set({
      currentSession: { ...s, complexityRan: true, complexityCorrect: correct },
    })
  },

  markUnderstood: () => {
    const s = get().currentSession
    if (!s) return
    set({ currentSession: { ...s, timeToAnswer: Date.now() - s.startTime } })
  },

  recordClarityRating: (rating) => {
    const s = get().currentSession
    if (!s) return
    set({ currentSession: { ...s, clarityRating: rating } })
  },

  recordError: () => {
    const s = get().currentSession
    if (!s) return
    set({ currentSession: { ...s, errorsMade: s.errorsMade + 1 } })
  },

  endTask: () => {
    const s = get().currentSession
    if (!s) return
    // Fill the algorithm/trace fields from the classifier's final output.
    const out = useClassifierStore.getState().output
    const finished: StudySession = {
      ...s,
      endTime: Date.now(),
      language: out?.language ?? s.language,
      algorithmDetected: out?.classification.label ?? s.algorithmDetected,
      detectionTier: out?.classification.tier ?? s.detectionTier,
      confidence: out?.classification.confidence ?? s.confidence,
      totalFrames: out?.frames.length ?? s.totalFrames,
    }
    set({
      completedSessions: [...get().completedSessions, finished],
      currentSession: null,
    })
  },

  exportData: () => {
    const { completedSessions, participantId } = get()
    if (typeof document === 'undefined') return
    const blob = new Blob([JSON.stringify(completedSessions, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `algolens_study_P${participantId || 'XX'}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  clearData: () =>
    set({ completedSessions: [], currentSession: null, currentTaskId: '' }),
}))
