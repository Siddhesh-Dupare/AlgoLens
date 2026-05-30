import type { Matcher } from './helpers'
import { getArrayVar } from './helpers'

const ARR_NAMES = ['arr', 'array', 'nums', 'a', 'data']

export const matchBubbleSort: Matcher = (frames) => {
  if (frames.length < 4)
    return { algorithmClass: 'bubble_sort', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const hasI = frames.some((f) => f.variables['i'] !== undefined)
  const hasJ = frames.some((f) => f.variables['j'] !== undefined)

  if (hasI && hasJ) {
    score += 0.3
    evidence.push('nested loop variables i and j present')
  }

  let adjacentSwaps = 0

  for (let f = 1; f < frames.length; f++) {
    const arrCurr = getArrayVar(frames[f], ARR_NAMES)
    const arrPrev = getArrayVar(frames[f - 1], ARR_NAMES)
    if (arrCurr && arrPrev && arrCurr.length === arrPrev.length) {
      const diffs = arrCurr.reduce(
        (acc, v, i) => (v !== arrPrev[i] ? acc + 1 : acc),
        0
      )
      if (diffs === 2) adjacentSwaps++
    }
  }

  if (adjacentSwaps > 0) {
    score += 0.4
    evidence.push(`${adjacentSwaps} swap operations detected`)
  }

  const swapFrames = frames.filter((f) => f.stepType === 'swap').length
  if (swapFrames > 0) {
    score += 0.3
    evidence.push('swap stepType present in trace')
  }

  return { algorithmClass: 'bubble_sort', score: Math.min(score, 1), evidence }
}
