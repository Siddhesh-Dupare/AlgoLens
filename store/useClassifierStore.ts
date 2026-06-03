import { create } from 'zustand'
import type {
  ClassifierOutput,
  VisualIRFrame,
} from '@/lib/classifier/types'

interface ClassifierStore {
  output: ClassifierOutput | null
  isClassifying: boolean
  classifyError: string | null
  currentIRFrame: VisualIRFrame | null
  irFrameIndex: number

  setOutput: (output: ClassifierOutput) => void
  setIsClassifying: (v: boolean) => void
  setClassifyError: (e: string | null) => void
  setIRFrameIndex: (index: number) => void
  reset: () => void
}

export const useClassifierStore = create<ClassifierStore>((set, get) => ({
  output: null,
  isClassifying: false,
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
  setClassifyError: (e) => set({ classifyError: e }),

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
      classifyError: null,
      currentIRFrame: null,
      irFrameIndex: 0,
    }),
}))
