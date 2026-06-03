import type { Matcher } from './helpers'
import { getArrayVar } from './helpers'

const ARR_NAMES = ['arr', 'array', 'nums', 'a', 'data']

export const matchSelectionSort: Matcher = (frames) => {
  if (frames.length < 4)
    return { algorithmClass: 'selection_sort', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const hasI = frames.some((f) => f.variables['i'] !== undefined)
  const hasJ = frames.some((f) => f.variables['j'] !== undefined)
  const hasMinIdx = frames.some(
    (f) =>
      f.variables['min_idx'] ||
      f.variables['minIdx'] ||
      f.variables['min_i'] ||
      f.variables['minIndex']
  )

  if (hasI && hasJ) {
    score += 0.25
    evidence.push('nested loops i, j')
  }
  if (hasMinIdx) {
    score += 0.45
    evidence.push('min_idx tracking variable')
  }

  let swapCount = 0
  for (let f = 1; f < frames.length; f++) {
    const a = getArrayVar(frames[f], ARR_NAMES)
    const b = getArrayVar(frames[f - 1], ARR_NAMES)
    if (a && b && a.length === b.length) {
      const diffs = a.reduce((acc, v, i) => (v !== b[i] ? acc + 1 : acc), 0)
      if (diffs === 2) swapCount++
    }
  }

  const swapRatio = swapCount / Math.max(frames.length, 1)
  if (swapRatio < 0.1 && swapCount > 0) {
    score += 0.3
    evidence.push(
      `low swap ratio (${swapCount} swaps) consistent with selection sort`
    )
  }

  return { algorithmClass: 'selection_sort', score: Math.min(score, 1), evidence }
}
