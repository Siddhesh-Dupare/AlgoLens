import { create } from 'zustand'
import type { TraceFrame } from '@/lib/executionTypes'

interface TraceStore {
  frames: TraceFrame[]
  frameIndex: number
  totalFrames: number
  currentFrame: TraceFrame | null
  setFrames: (frames: TraceFrame[]) => void
  stepForward: () => void
  stepBack: () => void
  jumpToFrame: (index: number) => void
  resetTrace: () => void
}

export const useTraceStore = create<TraceStore>((set, get) => ({
  frames: [],
  frameIndex: 0,
  totalFrames: 0,
  currentFrame: null,

  setFrames: (frames) =>
    set({
      frames,
      totalFrames: frames.length,
      frameIndex: 0,
      currentFrame: frames[0] ?? null,
    }),

  stepForward: () => {
    const { frameIndex, frames } = get()
    const next = Math.min(frameIndex + 1, frames.length - 1)
    set({ frameIndex: next, currentFrame: frames[next] ?? null })
  },

  stepBack: () => {
    const { frameIndex, frames } = get()
    const prev = Math.max(frameIndex - 1, 0)
    set({ frameIndex: prev, currentFrame: frames[prev] ?? null })
  },

  jumpToFrame: (index) => {
    const { frames } = get()
    const clamped = Math.max(0, Math.min(index, frames.length - 1))
    set({ frameIndex: clamped, currentFrame: frames[clamped] ?? null })
  },

  resetTrace: () =>
    set({ frames: [], frameIndex: 0, totalFrames: 0, currentFrame: null }),
}))
