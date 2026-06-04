import { create } from 'zustand'
import type {
  ClassifierOutput,
  VisualIRFrame,
} from '@/lib/classifier/types'

interface ClassifierStore {
  output: ClassifierOutput | null
  isClassifying: boolean
  isNarrating: boolean
  classifyError: string | null
  currentIRFrame: VisualIRFrame | null
  irFrameIndex: number

  setOutput: (output: ClassifierOutput) => void
  setIsClassifying: (v: boolean) => void
  setIsNarrating: (v: boolean) => void
  setClassifyError: (e: string | null) => void
  setIRFrameIndex: (index: number) => void
  // Replace the frame list in place (e.g. after AI narrations arrive) WITHOUT
  // resetting the user's current position — keeps irFrameIndex and refreshes
  // currentIRFrame at that index so the renderer re-reads the new narration.
  updateFrames: (frames: VisualIRFrame[]) => void
  reset: () => void
}

export const useClassifierStore = create<ClassifierStore>((set, get) => ({
  output: null,
  isClassifying: false,
  isNarrating: false,
  classifyError: null,
  currentIRFrame: null,
  irFrameIndex: 0,

  setOutput: (output) =>
    set({
      output,
      irFrameIndex: 0,
      currentIRFrame: output.frames[0] ?? null,
    }),

  setIsClassifying: (v) => set({ isClassifying: v }),
  setIsNarrating: (v) => set({ isNarrating: v }),
  setClassifyError: (e) => set({ classifyError: e }),

  updateFrames: (frames) => {
    const { output, irFrameIndex } = get()
    if (!output) return
    set({
      output: { ...output, frames },
      currentIRFrame: frames[irFrameIndex] ?? frames[0] ?? null,
    })
  },

  setIRFrameIndex: (index) => {
    const { output } = get()
    if (!output) return
    const clamped = Math.max(0, Math.min(index, output.frames.length - 1))
    set({
      irFrameIndex: clamped,
      currentIRFrame: output.frames[clamped] ?? null,
    })
  },

  reset: () =>
    set({
      output: null,
      isClassifying: false,
      isNarrating: false,
      classifyError: null,
      currentIRFrame: null,
      irFrameIndex: 0,
    }),
}))
